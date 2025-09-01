import nacl from 'tweetnacl';
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
// Key management now handled entirely by Edge Functions

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
  constructor(
    private supabaseService: SupabaseService
  ) {}

  // Eliminado: la generación de claves ahora vive en Edge Functions

  private firmar(payloadString: string, privateKeyBase64: string): string {
    const sk = base64ToU8(privateKeyBase64);
    const sig = nacl.sign.detached(new TextEncoder().encode(payloadString), sk);
    return u8ToBase64(sig);
  }

  private verificarFirma(payloadString: string, signature: string, publicKey: string): boolean {
    try {
      const pk = base64ToU8(publicKey);
      const sig = base64ToU8(signature);
      const payload = new TextEncoder().encode(payloadString);
      return nacl.sign.detached.verify(payload, sig, pk);
    } catch (error) {
      console.error('Error al verificar firma:', error);
      return false;
    }
  }

  async createQRCodeForOrder(orderId: string, _storeId?: string | null) {
    // Todo el proceso se delega al backend (Edge Function sign_qr)
    try {
      const result = await this.supabaseService.signQr(orderId);
      // Devolvemos el jws para que el front pinte el QR
      return { jws: result.jws, payload: result.payload };
    } catch (error) {
      console.error('❌ Error creando QR code mediante sign_qr:', error);
      throw error;
    }
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

  async validateQRCode(orderId: string, scannedData: string): Promise<boolean> {
    try {
      console.log('Validando QR - orderId:', orderId, 'scannedData:', scannedData);
      
      // Parsear los datos escaneados (pueden venir como string o ya parseados)
      let qrData;
      if (typeof scannedData === 'string') {
        try {
          qrData = JSON.parse(scannedData);
        } catch (parseError) {
          console.error('Error al parsear datos del QR:', parseError);
          return false;
        }
      } else {
        // Ya viene parseado como objeto
        qrData = scannedData;
      }

      // Verificar que el QR contiene los datos necesarios
      if (!qrData.order_id || !qrData.code || !qrData.signature || !qrData.public_key) {
        console.error('QR no contiene los datos necesarios');
        return false;
      }

      // Verificar que el order_id coincide
      if (qrData.order_id !== orderId) {
        console.error('Order ID no coincide');
        return false;
      }

      // Buscar el QR en la base de datos
      const { data: qrCode, error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .select('*')
        .eq('order_id', orderId)
        .eq('code', qrData.code)
        .single();

      if (error) {
        console.error('Error al buscar QR en BD:', error);
        return false;
      }

      if (!qrCode) {
        console.error('QR no encontrado en la base de datos');
        return false;
      }

      // Verificar si el QR sigue siendo válido
      if (!qrCode.is_valid) {
        console.error('QR ya no es válido');
        return false;
      }

      // Verificar intentos de validación
      if (qrCode.validation_attempts >= 3) {
        console.error('QR ha excedido los intentos de validación');
        return false;
      }

      // Verificar que la clave pública coincide
      if (qrCode.public_key !== qrData.public_key) {
        console.error('Clave pública no coincide');
        return false;
      }

      // VERIFICACIÓN CRIPTOGRÁFICA: Verificar la firma digital
      // Usar el payload original que se guardó en la base de datos
      // IMPORTANTE: No usar JSON.stringify para evitar modificaciones en el timestamp
      const payloadForVerification = qrCode.payload;
      
      console.log('Payload para verificación (original de BD):', payloadForVerification);
      console.log('Tipo de payload:', typeof payloadForVerification);
      
      // Si el payload es un objeto, convertirlo a string exactamente como se firmó
      let payloadString;
      if (typeof payloadForVerification === 'object') {
        payloadString = JSON.stringify(payloadForVerification);
        console.log('Payload stringificado:', payloadString);
      } else {
        payloadString = payloadForVerification;
        console.log('Payload ya es string:', payloadString);
      }
      
      const isSignatureValid = this.verificarFirma(payloadString, qrData.signature, qrData.public_key);
      if (!isSignatureValid) {
        console.error('Firma digital no válida');
        console.error('Payload verificado:', payloadForVerification);
        console.error('Firma recibida:', qrData.signature);
        console.error('Clave pública:', qrData.public_key);
        await this.incrementValidationAttempt(orderId);
        return false;
      }

      // Verificar timestamp (QR no debe ser muy antiguo - máximo 24 horas)
      const qrTimestamp = new Date(qrCode.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - qrTimestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        console.error('QR ha expirado (más de 24 horas)');
        return false;
      }

      console.log('QR validado correctamente con verificación criptográfica');
      return true;
    } catch (error) {
      console.error('Error validating QR code:', error);
      return false;
    }
  }

  async incrementValidationAttempt(orderId: string): Promise<void> {
    try {
      // Obtener el QR actual
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
          is_valid: shouldBeValid,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) throw error;
      
      console.log(`Intentos de validación incrementados a ${newAttempts} para orden ${orderId}`);
    } catch (error) {
      console.error('Error incrementing validation attempt:', error);
      throw error;
    }
  }

  async markQRAsUsed(_orderId: string, scanned: string | { jws?: string; code?: string; signature?: string; public_key?: string }): Promise<void> {
    // Para JWS moderno: enviar el JWS completo
    if (typeof scanned === 'string') {
      const jwsCandidate = scanned.trim();
      if (jwsCandidate.split('.').length === 3) {
        const res = await this.supabaseService.redeemOrder(jwsCandidate);
        if (!res.success) throw new Error(res.reason || 'redeem failed');
        return;
      }
    }

    // Para objeto legado con firma manual, intentar redención offline si existe
    const jws = (scanned as any)?.jws as string | undefined;
    if (jws && jws.split('.').length === 3) {
      const res = await this.supabaseService.redeemOrder(jws);
      if (!res.success) throw new Error(res.reason || 'redeem failed');
      return;
    }

    // Si no hay JWS, invocar flujo offline (si está disponible en backend)
    const legacy = scanned as any;
    if (legacy && legacy.code && legacy.signature && legacy.public_key) {
      const claim = { code: legacy.code, signature: legacy.signature, public_key: legacy.public_key };
      try {
        const res = await this.supabaseService.redeemOrderOffline('legacy', claim);
        if (!res.success) throw new Error(res.reason || 'redeem offline failed');
      } catch (e) {
        // Si no existe la función offline, ignorar silenciosamente para compatibilidad
        console.warn('redeemOrderOffline no disponible o falló:', e);
      }
      return;
    }
  }

  // Método para verificar la propiedad de la tienda
  async verifyStoreOwnership(userId: string, storeId: string): Promise<boolean> {
    try {
      const { data: store, error } = await this.supabaseService.getClient()
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error('Error al verificar propiedad de tienda:', error);
        return false;
      }

      return store?.owner_id === userId;
    } catch (error) {
      console.error('Error verificando propiedad de tienda:', error);
      return false;
    }
  }
}