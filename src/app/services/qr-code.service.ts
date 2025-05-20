import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import * as CryptoJS from 'crypto-js';

export interface QRCode {
  id: string;
  order_id: string;
  code: string;
  public_key: string;
  private_key_hash: string;
  created_at: string;
  used_at?: string;
  used_by?: string;
  validation_attempts: number;
  is_valid: boolean;
  metadata?: any;
  privateKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {
  constructor(private supabaseService: SupabaseService) {}

  private generateKeyPair(): { publicKey: string; privateKey: string } {
    // Generar una clave privada aleatoria
    const privateKey = CryptoJS.lib.WordArray.random(32).toString();
    // Generar una clave pública basada en la privada
    const publicKey = CryptoJS.SHA256(privateKey).toString();

    return { publicKey, privateKey };
  }

  private hashPrivateKey(privateKey: string): string {
    return CryptoJS.SHA256(privateKey).toString();
  }

  async createQRCodeForOrder(orderId: string): Promise<QRCode | null> {
    try {
      // Generar par de claves
      const { publicKey, privateKey } = this.generateKeyPair();
      const privateKeyHash = this.hashPrivateKey(privateKey);

      // Generar código único para el QR
      const code = CryptoJS.lib.WordArray.random(16).toString();

      const qrData = {
        order_id: orderId,
        code: code,
        public_key: publicKey,
        private_key_hash: privateKeyHash,
        validation_attempts: 0,
        is_valid: true,
        metadata: {
          created_timestamp: new Date().toISOString(),
          type: 'order_qr'
        }
      };

      const { data: qrCode, error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .insert(qrData)
        .select()
        .single();

      if (error) {
        console.error('Error creating QR code:', error);
        return null;
      }

      // Retornar el código QR con la clave privada (solo se mostrará una vez)
      return {
        ...qrCode,
        privateKey // Esta clave solo se devuelve una vez y nunca se almacena
      };
    } catch (error) {
      console.error('Error in createQRCodeForOrder:', error);
      return null;
    }
  }

  async validateQRCode(orderId: string, code: string, privateKey?: string): Promise<boolean> {
    try {
      // Si se proporciona clave privada, usar la validación con clave
      if (privateKey) {
        const { data: qrCode, error } = await this.supabaseService.getClient()
          .from('qr_codes')
          .select('*')
          .eq('code', code)
          .single();

        if (error || !qrCode) {
          console.error('QR code not found');
          return false;
        }

        // Verificar si el código es válido
        if (!qrCode.is_valid) {
          console.error('QR code is no longer valid');
          return false;
        }

        // Verificar la clave privada
        const providedKeyHash = this.hashPrivateKey(privateKey);
        if (providedKeyHash !== qrCode.private_key_hash) {
          // Incrementar el contador de intentos fallidos
          await this.supabaseService.getClient()
            .from('qr_codes')
            .update({ 
              validation_attempts: qrCode.validation_attempts + 1,
              is_valid: qrCode.validation_attempts < 2 // Invalidar después de 3 intentos
            })
            .eq('id', qrCode.id);

          return false;
        }

        // Marcar como usado
        await this.supabaseService.getClient()
          .from('qr_codes')
          .update({
            used_at: new Date().toISOString(),
            is_valid: false
          })
          .eq('id', qrCode.id);

        return true;
      }
      
      // Validación simple sin clave privada
      const { data, error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .select('is_valid, validation_attempts')
        .eq('order_id', orderId)
        .eq('code', code)
        .single();

      if (error) throw error;
      if (!data) return false;

      return data.is_valid && data.validation_attempts < 3;
    } catch (error) {
      console.error('Error validating QR code:', error);
      return false;
    }
  }

  async getQRCodeByOrderId(orderId: string): Promise<QRCode | null> {
    try {
      const { data: qrCode, error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        console.error('Error fetching QR code:', error);
        return null;
      }

      return qrCode;
    } catch (error) {
      console.error('Error in getQRCodeByOrderId:', error);
      return null;
    }
  }

  async getQRCode(orderId: string): Promise<{ qr_code: string }> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('qr_codes')
        .select('code')
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('QR code not found');

      return { qr_code: data.code };
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }

  async incrementValidationAttempt(orderId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .rpc('increment_qr_validation_attempt', {
          order_id_param: orderId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing validation attempt:', error);
      throw error;
    }
  }
} 