import nacl from 'tweetnacl';
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

// ---- utils base64 sin Buffer ----
function u8ToBase64(u8: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}
function base64ToU8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

@Injectable({ providedIn: 'root' })
export class QrCodeService {
  constructor(private supabaseService: SupabaseService) {}

  private async generarClavesEd25519() {
    const keyPair = nacl.sign.keyPair();
    const publicKey = u8ToBase64(keyPair.publicKey);
    const privateKey = u8ToBase64(keyPair.secretKey);
    const privateKeyHash = await sha256Hex(privateKey); // guardamos SOLO el hash
    return { publicKey, privateKey, privateKeyHash };
  }

  private firmar(payloadString: string, privateKeyBase64: string): string {
    const sk = base64ToU8(privateKeyBase64);
    const sig = nacl.sign.detached(new TextEncoder().encode(payloadString), sk);
    return u8ToBase64(sig);
  }

  async createQRCodeForOrder(orderId: string, storeId?: string | null) {
    if (!storeId) throw new Error('storeId es requerido para generar el QR');

    const supabase = this.supabaseService.getClient();

    // 1) ¿Existe clave activa para la tienda?  (leer)
const { data: existingKey, error: kSelErr } = await supabase
.from('keys_public')              // <--- LEE de la vista (no contiene el hash)
.select('id, public_key, is_active, store_id')
.eq('store_id', storeId)
.eq('is_active', true)
.maybeSingle();

let publicKey: string;
let privateKey: string | null = null;
let keyId: string;

if (!existingKey) {
// 2) No hay clave -> generamos y GUARDAMOS en la tabla real (escritura)
// como la función es async, devuelve Promise<{ publicKey, privateKey, privateKeyHash }>
const { publicKey: pub, privateKey: priv, privateKeyHash } = 
  await this.generarClavesEd25519();

const { data: newKey, error: keyInsErr } = await supabase
  .from('keys')                   // <--- INSERTA en la tabla
  .insert([{
    store_id: storeId,
    public_key: pub,
    private_key_hash: privateKeyHash,
    is_active: true,
  }])
  .select('id')
  .single();

if (keyInsErr) throw keyInsErr;

publicKey = pub;
privateKey = priv;        // ¡sólo se devuelve al cliente 1 vez!
keyId = newKey.id;
} else {
publicKey = existingKey.public_key;
keyId    = existingKey.id;
// privateKey = null;        // si existía, no la tenemos en cliente (bien por seguridad)
}


    // 2) Payload del QR
    const payload = { order_id: orderId, store_id: storeId, timestamp: new Date().toISOString() };
    const payloadString = JSON.stringify(payload);

    // 3) Firma (solo si acabamos de generar la clave y tenemos la privada)
    let signature = '';
    if (privateKey) {
      signature = this.firmar(payloadString, privateKey);
    }

    // 4) Guardar QR
    const { data: qrCode, error: qrErr } = await supabase
      .from('qr_codes')
      .insert([{
        order_id: orderId,
        store_id: storeId,
        payload,
        signature,
        validation_attempts: 0,
        is_valid: true,
        code: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        key_id: keyId,
        metadata: { created_timestamp: new Date().toISOString(), type: 'order_qr' }
      }])
      .select()
      .single();
    if (qrErr) throw qrErr;

    // 5) Lo que devuelve el servicio al front
    const qrPayload = JSON.stringify({ payload, signature });
    return { ...qrCode, qr_code: qrPayload, public_key: publicKey, privateKey };
  }

  async getQrCodeByOrderId(orderId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('qr_codes')
      .select('*')
      .eq('order_id', orderId)
      .single();
    if (error) throw error;
    return data;
  }
}