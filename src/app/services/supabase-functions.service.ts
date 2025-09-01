import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface StorePublicKey {
  id: string; // kid
  store_id: string;
  public_key: string; // base64url or base64 encoded raw Ed25519 public key
  status: 'active' | 'retired' | 'revoked';
  not_before: string; // ISO string
  not_after: string | null; // ISO string or null
}

@Injectable({ providedIn: 'root' })
export class SupabaseFunctionsService {
  constructor(private supabaseService: SupabaseService) {}

  async getStorePublicKeys(storeId: string): Promise<StorePublicKey[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.functions.invoke('get_store_public_keys', {
      body: { store_id: storeId }
    });
    if (error) throw error;
    return (data?.keys ?? []) as StorePublicKey[];
  }
}


