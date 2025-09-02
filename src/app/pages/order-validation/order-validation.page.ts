import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { QrScannerService } from '../../services/qr-scanner.service';
import { OrderService } from '../../services/order.service';
import { QrCodeService } from '../../services/qr-code.service';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { SupabaseFunctionsService } from '../../services/supabase-functions.service';
import nacl from 'tweetnacl';
import { QrScannerModalComponent } from '../../components/qr-scanner-modal/qr-scanner-modal.component';

@Component({
  selector: 'app-order-validation',
  templateUrl: './order-validation.page.html',
  styleUrls: ['./order-validation.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class OrderValidationPage implements OnInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  isScanning = false;
  lastScannedOrder: any = null;
  scannerPermission = false;
  storeId: string;
  permissionDenied = false;
  isSafari = false;
  permissionCheckAttempts = 0;
  maxPermissionAttempts = 3;

  constructor(
    private qrScanner: QrScannerService,
    private orderService: OrderService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    public platform: Platform,
    private qrCodeService: QrCodeService,
    private supabaseService: SupabaseService,
    private supaFx: SupabaseFunctionsService,
    private modalCtrl: ModalController
  ) {
    this.storeId = this.route.snapshot.paramMap.get('storeId') || '';
    this.detectSafari();
  }

  private detectSafari() {
    const userAgent = navigator.userAgent.toLowerCase();
    this.isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  }

  async ngOnInit() {
    if (!this.storeId) {
      this.notificationService.show({
        message: 'Error: No se ha especificado una tienda',
        type: 'error',
        duration: 3000
      });
      return;
    }

    // Verificar si hay un código QR en los parámetros de la URL
    const qrCode = this.route.snapshot.queryParamMap.get('qrCode');
    if (qrCode) {
      await this.validateOrder(qrCode);
    } else {
      await this.checkPermissions();
    }
  }

  async checkPermissions() {
    try {
      // Resetear los permisos si estamos en Safari y hemos excedido los intentos
      if (this.isSafari && this.permissionCheckAttempts >= this.maxPermissionAttempts) {
        this.qrScanner.resetPermissions();
        this.permissionCheckAttempts = 0;
      }
      this.permissionCheckAttempts++;
      this.scannerPermission = await this.qrScanner.hasPermission();
      this.permissionDenied = !this.scannerPermission;

      if (this.permissionDenied && this.isSafari) {
        this.notificationService.show({
          message: 'Por favor, permite el acceso a la cámara en los ajustes de Safari y vuelve a intentarlo',
          type: 'warning',
          duration: 5000
        });
      } else if (this.permissionDenied) {
        this.notificationService.show({
          message: 'Se requiere permiso para usar la cámara. Por favor, otorga el permiso en la configuración de tu dispositivo.',
          type: 'warning',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      this.scannerPermission = false;
      this.permissionDenied = true;
    }
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  async startScanning() {
    try {
      // Verificar permisos (no bloqueamos la apertura del modal)
      if (!this.scannerPermission) {
        await this.checkPermissions();
      }

      console.log('[OrderValidation] Abriendo modal de escáner...');
      const modal = await this.modalCtrl.create({
        component: QrScannerModalComponent,
        cssClass: 'qr-scanner-modal',
        backdropDismiss: false
      });

      await modal.present();
      console.log('[OrderValidation] Modal de escáner presentado');
      const { data, role } = await modal.onDidDismiss();
      console.log('[OrderValidation] Modal cerrado:', role, data);
      if (role === 'confirm' && data?.value) {
        await this.validateOrder(data.value);
      } else if (role !== 'confirm') {
        this.notificationService.show({
          message: 'Escaneo cancelado',
          type: 'warning',
          duration: 1500
        });
      }
    } catch (error) {
      console.error('Error opening scanner modal:', error);
      this.notificationService.show({
        message: 'Error al abrir el escáner',
        type: 'error',
        duration: 3000
      });
    }
  }

  async stopScanning() {
    try {
      this.isScanning = false;
      await this.qrScanner.stopScan();
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  }

  private async validateOrder(qrContent: string) {
    try {
      // 1) Si es JWS (tres partes separadas por puntos), verificar primero
      let orderId: string | null = null;
      let isJws = false;
      const parts = qrContent.split('.');
      if (parts.length === 3) {
        isJws = true;
        const verify = await this.verifyJws(qrContent);
        if (!verify.ok) {
          this.notificationService.show({ message: verify.reason || 'JWS inválido', type: 'error', duration: 3000 });
          return;
        }
        orderId = verify.payload?.oid || null;
      } else {
        // 2) Fallback: JSON/UUID como antes
        const parsed = this.parseQrContent(qrContent);
        orderId = parsed.orderId;
      }

      if (!orderId) {
        this.notificationService.show({
          message: 'Código QR inválido',
          type: 'error',
          duration: 3000
        });
        return;
      }

      // Comprobar si el QR ya fue utilizado (is_valid = false)
      try {
        const supabase = this.supabaseService.getClient();
        const { data: qrRow, error: qrErr } = await supabase
          .from('qr_codes')
          .select('id, is_valid, used_at, used_by, validation_attempts')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!qrErr && qrRow && qrRow.is_valid === false) {
          // Sumar intento y guardar timestamp del último intento
          try {
            const newAttempts = (qrRow.validation_attempts || 0) + 1;
            const baseUpdate: any = {
              validation_attempts: newAttempts,
              updated_at: new Date().toISOString()
            };
            // Intentar guardar last_attempt_at si la columna existe
            (baseUpdate as any).last_attempt_at = new Date().toISOString();
            const { data: updData, error: updErr1 } = await supabase
              .from('qr_codes')
              .update(baseUpdate)
              .eq('id', qrRow.id)
              .select()
              .single();
            console.log('Update result (invalid QR):', updData, updErr1);
            if (updErr1) throw updErr1;
          } catch (updErr) {
            // Si falla por columna inexistente u otro motivo, intentar solo validation_attempts
            try {
              const { data: updData2, error: updErr2 } = await supabase
                .from('qr_codes')
                .update({
                  validation_attempts: (qrRow.validation_attempts || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', qrRow.id)
                .select()
                .single();
              console.log('Fallback update result (invalid QR):', updData2, updErr2);
            } catch (updErr2) {
              console.warn('No se pudo registrar el intento de validación para QR inválido:', updErr2);
            }
          }

          this.notificationService.show({
            message: 'Este QR ya fue utilizado y no es válido',
            type: 'error',
            duration: 3000
          });
          return;
        }
      } catch (e) {
        console.warn('No se pudo comprobar el estado del QR:', e);
      }

      console.log('Validando pedido:', orderId, 'para tienda:', this.storeId);

      // PASO 1: Verificar propiedad de la tienda
      const user = await this.supabaseService.getClient().auth.getUser();
      if (!user.data.user?.id) {
        this.notificationService.show({
          message: 'Error de autenticación. Inicia sesión de nuevo.',
          type: 'error',
          duration: 3000
        });
        return;
      }

      const isOwner = await this.qrCodeService.verifyStoreOwnership(user.data.user.id, this.storeId);
      if (!isOwner) {
        // Incrementar intentos fallidos si no es el dueño de la tienda
        try {
          await this.qrCodeService.incrementValidationAttempt(orderId);
          console.log('Incrementado intento fallido para usuario no autorizado');
        } catch (error) {
          console.error('Error al incrementar intento fallido:', error);
        }
        
        this.notificationService.show({
          message: 'No tienes permisos para validar pedidos de esta tienda',
          type: 'error',
          duration: 3000
        });
        return;
      }

      // PASO 2: Obtener el pedido y verificar que pertenece a esta tienda
      const order = await this.orderService.getOrderById(orderId);
      
      if (!order) {
        this.notificationService.show({
          message: 'Pedido no encontrado',
          type: 'error',
          duration: 3000
        });
        return;
      }

      console.log('Pedido encontrado:', order);

      // Verificar que el pedido pertenece a esta tienda
      if (order.store_id !== this.storeId) {
        // Incrementar intentos fallidos si no es el pedido correcto
        try {
          await this.qrCodeService.incrementValidationAttempt(orderId);
          console.log('Incrementado intento fallido para QR de tienda incorrecta');
        } catch (error) {
          console.error('Error al incrementar intento fallido:', error);
        }
        
        this.notificationService.show({
          message: 'Este pedido no pertenece a tu tienda',
          type: 'error',
          duration: 3000
        });
        return;
      }

      // PASO 3: Verificar si el pedido está pendiente
      if (order.status !== 'pending') {
        this.notificationService.show({
          message: 'Este pedido ya ha sido validado',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      // PASO 4: Si no es JWS, mantener validación antigua (backwards-compat)
      const { qrData } = { qrData: undefined as any };
      if (!isJws && qrData && qrData.signature && qrData.public_key) {
        console.log('=== VALIDACIÓN CRIPTOGRÁFICA INICIADA ===');
        console.log('Datos del QR recibidos:', {
          order_id: qrData.order_id,
          code: qrData.code,
          signature: qrData.signature ? 'PRESENTE' : 'AUSENTE',
          public_key: qrData.public_key ? 'PRESENTE' : 'AUSENTE'
        });
        
                 const isValid = await this.qrCodeService.validateQRCode(orderId, qrData);
        console.log('Resultado validación criptográfica QR:', isValid);
        
        if (!isValid) {
          console.error('❌ Validación criptográfica FALLÓ');
          
                     // IMPORTANTE: Marcar el QR como usado ANTES del return
           // porque se intentó validar (incluso si falló)
           try {
             console.log('Marcando QR como usado (validación fallida)...');
             // CORREGIDO: Pasar qrData en lugar de qrContent para que tenga el campo 'code'
             await this.qrCodeService.markQRAsUsed(orderId, qrData);
             console.log('✅ QR marcado como usado (intento de validación)');
           } catch (error) {
             console.error('❌ Error al marcar QR como usado:', error);
           }
          
          this.notificationService.show({
            message: 'Código QR inválido, expirado o ya utilizado',
            type: 'error',
            duration: 3000
          });
          return;
        }
        
        console.log('✅ Validación criptográfica EXITOSA');
        
                 // PASO 5: Marcar el QR como usado después de validación exitosa
         try {
           console.log('Marcando QR como usado...');
           // CORREGIDO: Pasar qrData en lugar de qrContent para que tenga el campo 'code'
           await this.qrCodeService.markQRAsUsed(orderId, qrData);
           console.log('✅ QR marcado como usado exitosamente');
         } catch (error) {
           console.error('❌ Error al marcar QR como usado:', error);
           this.notificationService.show({
             message: 'Error al procesar el código QR. Intenta de nuevo.',
             type: 'error',
             duration: 3000
           });
           return;
         }
      } else {
        // Si no hay datos del QR completos, solo validar que el pedido esté pendiente
        console.log('⚠️ QR sin datos criptográficos, validando solo estado del pedido');
        console.log('qrData recibido:', qrData);
        if (order.status !== 'pending') {
          this.notificationService.show({
            message: 'Este pedido ya ha sido procesado',
            type: 'warning',
            duration: 3000
          });
          return;
        }
      }
      
      console.log('Pedido válido para procesar');

      // PASO 6: Marcar QR como usado (para trazabilidad) y luego marcar pedido entregado
      try {
        const supabase = this.supabaseService.getClient();
        const { data: authUser } = await supabase.auth.getUser();
        const currentUserId = authUser.user?.id || null;
        await supabase
          .from('qr_codes')
          .update({
            used_at: new Date().toISOString(),
            used_by: currentUserId,
            is_valid: false,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);
      } catch (e) {
        console.warn('No se pudo marcar el QR como usado:', e);
      }

      console.log('Marcando pedido como entregado...');
      const success = await this.orderService.markOrderAsDelivered(orderId);
      console.log('Resultado marcado como entregado:', success);
      
      if (success) {
        this.lastScannedOrder = order;
        this.notificationService.show({
          message: 'Pedido validado y entregado correctamente',
          type: 'success',
          duration: 2000
        });
      } else {
        this.notificationService.show({
          message: 'Error al validar el pedido',
          type: 'error',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error validating order:', error);
      // Mostrar error más específico
      let errorMessage = 'Error al procesar el código QR';
      if (error instanceof Error) {
        if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = 'Error del servidor. Intenta de nuevo en unos momentos.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Error de autenticación. Inicia sesión de nuevo.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'Pedido no encontrado.';
        } else if (error.message.includes('Usuario no autenticado')) {
          errorMessage = 'Sesión expirada. Inicia sesión de nuevo.';
        } else if (error.message.includes('No tienes permisos')) {
          errorMessage = 'No tienes permisos para esta operación.';
        }
      }
      this.notificationService.show({
        message: errorMessage,
        type: 'error',
        duration: 3000
      });
    }
  }

  private parseQrContent(qrContent: string): { orderId: string | null; qrData?: any } {
    console.log('=== INICIO PARSING QR ===');
    console.log('Contenido QR recibido:', qrContent);
    
    // Intentar parsear como JSON (nuevo formato con criptografía)
    try {
      const obj = JSON.parse(qrContent);
      console.log('✅ QR parseado como JSON exitosamente');
      console.log('Estructura del objeto:', {
        orderId: obj.orderId,
        hasPayload: !!obj.payload,
        payloadKeys: obj.payload ? Object.keys(obj.payload) : 'NO TIENE PAYLOAD',
        order_id: obj.order_id,
        code: obj.code,
        signature: obj.signature,
        public_key: obj.public_key
      });
      
             // NUEVO: Verificar si es el formato actual con orderId y payload
       if (obj.orderId && obj.payload) {
         console.log('🎯 QR con formato actual (orderId + payload)');
         console.log('Payload completo:', obj.payload);
         
         // CORREGIDO: El payload es un string JSON escapado, necesitamos parsearlo
         let payloadData;
         try {
           if (typeof obj.payload === 'string') {
             console.log('📝 Payload es un string, parseándolo...');
             payloadData = JSON.parse(obj.payload);
             console.log('✅ Payload parseado exitosamente:', payloadData);
           } else {
             payloadData = obj.payload;
             console.log('📝 Payload ya es un objeto');
           }
         } catch (parseError) {
           console.error('❌ Error al parsear payload:', parseError);
           return { 
             orderId: obj.orderId, 
             qrData: undefined
           };
         }
         
         console.log('Verificando campos del payload parseado:', {
           order_id: payloadData.order_id,
           code: payloadData.code,
           signature: payloadData.signature ? 'PRESENTE' : 'AUSENTE',
           public_key: payloadData.public_key ? 'PRESENTE' : 'AUSENTE'
         });
         
         if (payloadData.order_id && payloadData.code && payloadData.signature && payloadData.public_key) {
           console.log('✅ Payload contiene datos criptográficos completos');
           const qrData = {
             order_id: payloadData.order_id,
             code: payloadData.code,
             signature: payloadData.signature,
             public_key: payloadData.public_key,
             key_id: payloadData.key_id
           };
           console.log('qrData construido:', qrData);
           return { 
             orderId: obj.orderId, 
             qrData: qrData
           };
         } else {
           console.log('⚠️ Payload no contiene datos criptográficos completos');
           console.log('Campos faltantes:', {
             order_id: !payloadData.order_id ? 'FALTA' : 'OK',
             code: !payloadData.code ? 'FALTA' : 'OK',
             signature: !payloadData.signature ? 'FALTA' : 'OK',
             public_key: !payloadData.public_key ? 'FALTA' : 'OK'
           });
           return { 
             orderId: obj.orderId, 
             qrData: undefined
           };
         }
       }
      
      // Verificar si es el nuevo formato con datos criptográficos completos en nivel raíz
      if (obj.order_id && obj.code && obj.signature && obj.public_key) {
        console.log('QR con formato criptográfico completo (nivel raíz)');
        return { 
          orderId: obj.order_id, 
          qrData: obj
        };
      }
      
      // Si tiene payload, extraer order_id del payload (formato anterior)
      if (obj.payload && obj.payload.order_id) {
        console.log('QR con formato de payload');
        return { 
          orderId: obj.payload.order_id, 
          qrData: obj.signature ? obj : undefined
        };
      }
      
      // Fallback para formato anterior
      const orderId = obj.orderId || obj.order_id || null;
      if (orderId && typeof orderId === 'string') {
        console.log('QR con formato anterior');
        return { orderId, qrData: obj.code ? obj : undefined };
      }
    } catch (error) {
      console.log('QR no es JSON válido, intentando como UUID directo');
    }
    
    // Fallback: si parece un UUID, devolverlo tal cual
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
    const match = qrContent.match(uuidRegex);
    if (match) {
      console.log('QR parseado como UUID directo:', match[0]);
      return { orderId: match[0] };
    }
    
    console.log('No se pudo parsear el QR');
    return { orderId: null };
  }

  // ======= JWS verification =======
  private async verifyJws(jws: string): Promise<{ ok: boolean; reason?: string; header?: any; payload?: any }> {
    try {
      const [h, p, s] = jws.split('.');
      if (!h || !p || !s) return { ok: false, reason: 'Formato JWS inválido' };

      const header = JSON.parse(this.base64UrlDecodeToString(h));
      const payload = JSON.parse(this.base64UrlDecodeToString(p));

      // Cargar clave pública por kid desde Edge Function
      const keys = await this.supaFx.getStorePublicKeys(payload.sid);
      const key = (keys || []).find(k => k.id === header.kid);
      if (!key) return { ok: false, reason: 'Clave pública no encontrada' };

      // Verificar firma
      const ok = nacl.sign.detached.verify(
        new TextEncoder().encode(`${h}.${p}`),
        this.base64UrlToBytes(s),
        this.base64UrlToBytes(key.public_key)
      );
      if (!ok) return { ok: false, reason: 'Firma inválida' };

      // Verificar ventanas de tiempo
      const now = Math.floor(Date.now() / 1000);
      if (payload.nbf && now < payload.nbf) return { ok: false, reason: 'Not before (nbf)' };
      if (payload.exp && now > payload.exp) return { ok: false, reason: 'Expirado (exp)' };

      return { ok: true, header, payload };
    } catch (e: any) {
      return { ok: false, reason: e?.message || 'Error verificando JWS' };
    }
  }

  private base64UrlToBytes(b64u: string): Uint8Array {
    const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
    const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    return new Uint8Array([...bin].map(c => c.charCodeAt(0)));
  }

  private base64UrlDecodeToString(b64u: string): string {
    const decoder = new TextDecoder();
    return decoder.decode(this.base64UrlToBytes(b64u));
  }
} 