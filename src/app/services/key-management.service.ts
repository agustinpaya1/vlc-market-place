import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface StorePublicKey {
  id: string; // kid
  store_id: string;
  public_key: string;
  status: 'active' | 'retired' | 'revoked';
  not_before: string;
  not_after: string | null;
}

@Injectable({ providedIn: 'root' })
export class KeyManagementService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtener o generar clave activa para una tienda
   */
  async getActivePublicKey(storeId: string): Promise<StorePublicKey | null> {
    const keys = await this.getStorePublicKeys(storeId);
    const active = keys.find(k => k.status === 'active');
    return active ?? null;
  }

  /**
   * Obtener clave activa de una tienda
   */
  async getStorePublicKeys(storeId: string): Promise<StorePublicKey[]> {
    return await this.supabaseService.getStorePublicKeys(storeId);
  }

  /**
   * Generar nueva clave para una tienda
   * NOTA: La clave privada se almacena en Edge Function Secrets
   */
  // La generación y almacenamiento de claves ahora es exclusiva del backend (Edge Functions)

  /**
   * Generar par de claves Ed25519
   */
  private async generateEd25519KeyPair(): Promise<{ publicKey: string; privateKey: string; }> {
    throw new Error('Key generation must be performed by Edge Functions.');
  }

  /**
   * Almacenar clave privada en Edge Function Secrets
   * NOTA: En producción, esto se haría en el backend
   */
  private async storePrivateKeyInSecrets(_keyId: string, _privateKey: string): Promise<void> {
    throw new Error('Private keys must be stored server-side.');
  }

  /**
   * Desactivar clave de tienda
   */
  async deactivateStoreKey(_keyId: string): Promise<void> {
    throw new Error('Key deactivation must be performed by Edge Functions.');
  }

  /**
   * Obtener todas las claves de una tienda (activas e inactivas)
   */
  async getStoreKeys(storeId: string): Promise<StorePublicKey[]> {
    return this.getStorePublicKeys(storeId);
  }
}
