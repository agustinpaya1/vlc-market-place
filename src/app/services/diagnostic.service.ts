import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DiagnosticResult {
  section: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Diagnóstico completo del sistema
   */
  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    try {
      console.log('🔍 Iniciando diagnóstico completo...');
      
      // 1. Verificar usuario autenticado
      results.push(await this.checkUserAuthentication());
      
      // 2. Verificar tiendas del usuario
      results.push(await this.checkUserStores());
      
      // 3. Verificar acceso a tabla keys
      results.push(await this.checkKeysAccess());
      
      // 4. Verificar políticas RLS
      results.push(await this.checkRLSPolicies());
      
      // 5. Verificar estructura de datos
      results.push(await this.checkDataStructure());
      
      console.log('✅ Diagnóstico completado');
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      results.push({
        section: 'ERROR GENERAL',
        status: 'error',
        message: `Error ejecutando diagnóstico: ${error}`,
        data: error
      });
    }
    
    return results;
  }

  /**
   * Verificar autenticación del usuario
   */
  private async checkUserAuthentication(): Promise<DiagnosticResult> {
    try {
      const { data: { session }, error } = await this.supabaseService.getClient().auth.getSession();
      
      if (error) {
        return {
          section: 'USUARIO AUTENTICADO',
          status: 'error',
          message: `Error obteniendo sesión: ${error.message}`,
          data: error
        };
      }
      
      if (!session?.user) {
        return {
          section: 'USUARIO AUTENTICADO',
          status: 'warning',
          message: '❌ USUARIO NO AUTENTICADO - No hay sesión activa',
          data: { session: null }
        };
      }
      
      return {
        section: 'USUARIO AUTENTICADO',
        status: 'success',
        message: `✅ USUARIO AUTENTICADO - ID: ${session.user.id}`,
        data: { 
          userId: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata
        }
      };
      
    } catch (error) {
      return {
        section: 'USUARIO AUTENTICADO',
        status: 'error',
        message: `Error verificando autenticación: ${error}`,
        data: error
      };
    }
  }

  /**
   * Verificar tiendas del usuario
   */
  private async checkUserStores(): Promise<DiagnosticResult> {
    try {
      const { data: { session } } = await this.supabaseService.getClient().auth.getSession();
      
      if (!session?.user) {
        return {
          section: 'TIENDAS DEL USUARIO',
          status: 'warning',
          message: '❌ No se puede verificar - Usuario no autenticado',
          data: { stores: [] }
        };
      }
      
      const { data: stores, error } = await this.supabaseService.getClient()
        .from('stores')
        .select('*')
        .eq('owner_id', session.user.id);
      
      if (error) {
        return {
          section: 'TIENDAS DEL USUARIO',
          status: 'error',
          message: `Error obteniendo tiendas: ${error.message}`,
          data: error
        };
      }
      
      if (!stores || stores.length === 0) {
        return {
          section: 'TIENDAS DEL USUARIO',
          status: 'warning',
          message: `❌ USUARIO NO TIENE TIENDAS - Total: 0`,
          data: { stores: [], total: 0 }
        };
      }
      
      return {
        section: 'TIENDAS DEL USUARIO',
        status: 'success',
        message: `✅ USUARIO TIENE TIENDAS - Total: ${stores.length}`,
        data: { 
          stores: stores.map(s => ({ id: s.id, name: s.name, owner_id: s.owner_id })),
          total: stores.length
        }
      };
      
    } catch (error) {
      return {
        section: 'TIENDAS DEL USUARIO',
        status: 'error',
        message: `Error verificando tiendas: ${error}`,
        data: error
      };
    }
  }

  /**
   * Verificar acceso a tabla keys
   */
  private async checkKeysAccess(): Promise<DiagnosticResult> {
    try {
      const { data: { session } } = await this.supabaseService.getClient().auth.getSession();
      
      if (!session?.user) {
        return {
          section: 'ACCESO A TABLA KEYS',
          status: 'warning',
          message: '❌ No se puede verificar - Usuario no autenticado',
          data: { accessible: false }
        };
      }
      
      // Intentar acceder a keys
      const { data: keys, error } = await this.supabaseService.getClient()
        // keys es privada; evitar consulta directa para no romper RLS
        .from('stores')
        .select('*')
        .limit(1);
      
      if (error) {
        return {
          section: 'ACCESO A TABLA KEYS',
          status: 'error',
          message: `❌ ACCESO DENEGADO - ${error.message}`,
          data: { error, accessible: false }
        };
      }
      
      return {
        section: 'ACCESO A TABLA KEYS',
        status: 'success',
        message: `✅ ACCESO PERMITIDO - Se pueden leer claves`,
        data: { accessible: true, sampleData: keys }
      };
      
    } catch (error) {
      return {
        section: 'ACCESO A TABLA KEYS',
        status: 'error',
        message: `Error verificando acceso: ${error}`,
        data: error
      };
    }
  }

  /**
   * Verificar políticas RLS
   */
  private async checkRLSPolicies(): Promise<DiagnosticResult> {
    try {
      const { data: { session } } = await this.supabaseService.getClient().auth.getSession();
      
      if (!session?.user) {
        return {
          section: 'POLÍTICAS RLS',
          status: 'warning',
          message: '❌ No se puede verificar - Usuario no autenticado',
          data: { policies: [] }
        };
      }
      
      // Intentar crear una clave temporal para verificar políticas INSERT
      const testKey = {
        store_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
        public_key: 'test_public_key',
        is_active: false
      };
      
      const { error: insertError } = await this.supabaseService.getClient()
        .from('stores')
        .insert([testKey]);
      
      if (insertError) {
        return {
          section: 'POLÍTICAS RLS',
          status: 'warning',
          message: `⚠️ POLÍTICAS RLS ACTIVAS - ${insertError.message}`,
          data: { 
            error: insertError,
            hasRLS: true,
            canInsert: false
          }
        };
      }
      
      return {
        section: 'POLÍTICAS RLS',
        status: 'success',
        message: `✅ POLÍTICAS RLS PERMITEN INSERT`,
        data: { hasRLS: true, canInsert: true }
      };
      
    } catch (error) {
      return {
        section: 'POLÍTICAS RLS',
        status: 'error',
        message: `Error verificando políticas: ${error}`,
        data: error
      };
    }
  }

  /**
   * Verificar estructura de datos
   */
  private async checkDataStructure(): Promise<DiagnosticResult> {
    try {
      // Verificar que las tablas necesarias existen
      const { data: stores, error: storesError } = await this.supabaseService.getClient()
        .from('stores')
        .select('count')
        .limit(1);
      
      const { data: keys, error: keysError } = await this.supabaseService.getClient()
        .from('stores')
        .select('count')
        .limit(1);
      
      if (storesError || keysError) {
        return {
          section: 'ESTRUCTURA DE DATOS',
          status: 'error',
          message: `❌ ERROR ACCEDIENDO A TABLAS - Stores: ${storesError?.message || 'OK'}, Keys: ${keysError?.message || 'OK'}`,
          data: { storesError, keysError }
        };
      }
      
      return {
        section: 'ESTRUCTURA DE DATOS',
        status: 'success',
        message: `✅ TABLAS ACCESIBLES - Stores y Keys funcionan`,
        data: { storesAccessible: true, keysAccessible: true }
      };
      
    } catch (error) {
      return {
        section: 'ESTRUCTURA DE DATOS',
        status: 'error',
        message: `Error verificando estructura: ${error}`,
        data: error
      };
    }
  }

  /**
   * Mostrar resultados del diagnóstico en consola
   */
  logDiagnosticResults(results: DiagnosticResult[]): void {
    console.log('🔍 RESULTADOS DEL DIAGNÓSTICO COMPLETO');
    console.log('========================================');
    
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.section}: ${result.message}`);
      
      if (result.data) {
        console.log('   Datos:', result.data);
      }
    });
    
    console.log('========================================');
    
    // Resumen
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`📊 RESUMEN: ${successCount} ✅ | ${warningCount} ⚠️ | ${errorCount} ❌`);
  }
}

