import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  // Método para obtener el cliente de Supabase
  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Ejemplo de método para obtener datos de una tabla
  async getData(table: string) {
    const { data, error } = await this.supabase
      .from(table)
      .select('*');
    
    if (error) throw error;
    return data;
  }

  // Ejemplo de método para insertar datos
  async insertData(table: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  }


}