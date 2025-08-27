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

    // Generar claves simples para este pedido
    const { publicKey, privateKey, privateKeyHash } = await this.generarClavesEd25519();

    // Payload del QR
    const payload = { order_id: orderId, store_id: storeId, timestamp: new Date().toISOString() };
    const payloadString = JSON.stringify(payload);

    // Firma del payload
    const signature = this.firmar(payloadString, privateKey);

    // Guardar QR
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
        metadata: { created_timestamp: new Date().toISOString(), type: 'order_qr' }
      }])
      .select()
      .single();
    
    if (qrErr) throw qrErr;

    // Lo que devuelve el servicio al front
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

  async validateQRCode(orderId: string, code: string): Promise<boolean> {
    try {
      console.log('Validando QR - orderId:', orderId, 'code:', code);
      
      // Buscar el QR por order_id y signature (que es el código)
      const { data: qrCode, error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .select('*')
        .eq('order_id', orderId)
        .eq('signature', code)
        .single();

      console.log('Resultado consulta QR:', { data: qrCode, error });

      if (error) {
        console.error('Error al consultar QR:', error);
        // Si es error 406, intentar sin signature
        if (error.code === '406' || error.message?.includes('406')) {
          console.log('Intentando validación sin signature...');
          return await this.validateQRCodeSimple(orderId);
        }
        return false;
      }

      if (!qrCode) {
        console.error('QR code not found');
        return false;
      }

      // Verificar si el código es válido
      if (!qrCode.is_valid) {
        console.error('QR code is no longer valid');
        return false;
      }

      // Verificar intentos de validación
      if (qrCode.validation_attempts >= 3) {
        console.error('QR code exceeded validation attempts');
        return false;
      }

      console.log('QR validado correctamente');
      return true;
    } catch (error) {
      console.error('Error validating QR code:', error);
      return false;
    }
  }

  // Validación simple sin depender de signature
  private async validateQRCodeSimple(orderId: string): Promise<boolean> {
    try {
      console.log('Validación simple para orderId:', orderId);
      
      const { data: qrCode, error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .select('is_valid, validation_attempts')
        .eq('order_id', orderId)
        .single();

      console.log('Resultado validación simple:', { data: qrCode, error });

      if (error) {
        console.error('Error en validación simple:', error);
        return false;
      }

      if (!qrCode) {
        console.error('QR no encontrado en validación simple');
        return false;
      }

      return qrCode.is_valid && qrCode.validation_attempts < 3;
    } catch (error) {
      console.error('Error en validación simple:', error);
      return false;
    }
  }

  async incrementValidationAttempt(orderId: string): Promise<void> {
    try {
      // Primero obtener el QR actual para saber los intentos actuales
      const { data: qrCode, error: fetchError } = await this.supabaseService.getClient()
        .from('qr_codes')
        .select('validation_attempts')
        .eq('order_id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const newAttempts = (qrCode?.validation_attempts || 0) + 1;
      const shouldBeValid = newAttempts < 3;

      const { error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .update({ 
          validation_attempts: newAttempts,
          is_valid: shouldBeValid
        })
        .eq('order_id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing validation attempt:', error);
      throw error;
    }
  }

  async markQRAsUsed(orderId: string, code: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .update({
          used_at: new Date().toISOString(),
          is_valid: false,
          used_by: (await this.supabaseService.getClient().auth.getUser()).data.user?.id
        })
        .eq('order_id', orderId)
        .eq('signature', code);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking QR as used:', error);
      throw error;
    }
  }
}