import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { QrScannerService } from '../../services/qr-scanner.service';
import { OrderService } from '../../services/order.service';
import { QrCodeService } from '../../services/qr-code.service';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';

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
    private qrCodeService: QrCodeService
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
      // Detener cualquier escaneo previo
      await this.stopScanning();

      // Verificar permisos antes de iniciar
      if (!this.scannerPermission) {
        await this.checkPermissions();
        if (!this.scannerPermission) {
          return;
        }
      }

      this.isScanning = true;
      const scannedContent = await this.qrScanner.startScan();
      
      if (scannedContent) {
        await this.validateOrder(scannedContent);
      } else {
        this.notificationService.show({
          message: 'No se pudo leer el código QR',
          type: 'error',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error during scanning:', error);
      this.notificationService.show({
        message: 'Error al escanear el código QR',
        type: 'error',
        duration: 3000
      });
    } finally {
      this.isScanning = false;
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
      // El QR puede contener un JSON con { orderId, code, publicKey }
      const { orderId, code } = this.parseQrContent(qrContent);
      if (!orderId) {
        this.notificationService.show({
          message: 'Código QR inválido',
          type: 'error',
          duration: 3000
        });
        return;
      }

      console.log('Validando pedido:', orderId, 'para tienda:', this.storeId);

      // Obtener el pedido
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
        // Incrementar intentos fallidos si no es el dueño de la tienda
        try {
          await this.qrCodeService.incrementValidationAttempt(orderId);
          console.log('Incrementado intento fallido para QR no autorizado');
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

      // Verificar si el pedido está pendiente
      if (order.status !== 'pending') {
        this.notificationService.show({
          message: 'Este pedido ya ha sido validado',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      // Validar el QR si viene con código
      if (code) {
        console.log('Validando código QR:', code);
        const isValid = await this.qrCodeService.validateQRCode(orderId, code);
        console.log('Resultado validación QR:', isValid);
        if (!isValid) {
          this.notificationService.show({
            message: 'Código QR inválido o ya utilizado',
            type: 'error',
            duration: 3000
          });
          return;
        }
        
        // Marcar el QR como usado después de validación exitosa
        try {
          await this.qrCodeService.markQRAsUsed(orderId, code);
          console.log('QR marcado como usado');
        } catch (error) {
          console.error('Error al marcar QR como usado:', error);
          // No fallar la validación si no se puede marcar como usado
        }
      } else {
        // Si no hay código QR, solo validar que el pedido esté pendiente
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

      // Marcar el pedido como entregado
      console.log('Marcando pedido como entregado...');
      const success = await this.orderService.markOrderAsDelivered(orderId);
      console.log('Resultado marcado como entregado:', success);
      
      if (success) {
        this.lastScannedOrder = order;
        this.notificationService.show({
          message: 'Pedido validado correctamente',
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
        }
      }
      this.notificationService.show({
        message: errorMessage,
        type: 'error',
        duration: 3000
      });
    }
  }

  private parseQrContent(qrContent: string): { orderId: string | null; code?: string } {
    console.log('Parseando contenido QR:', qrContent);
    
    // Intentar parsear como JSON
    try {
      const obj = JSON.parse(qrContent);
      console.log('QR parseado como JSON:', obj);
      
      // Si tiene payload, extraer order_id del payload
      if (obj.payload && obj.payload.order_id) {
        return { 
          orderId: obj.payload.order_id, 
          code: obj.signature || undefined 
        };
      }
      
      // Fallback para formato anterior
      const orderId = obj.orderId || obj.order_id || null;
      const code = obj.code || undefined;
      if (orderId && typeof orderId === 'string') {
        return { orderId, code };
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
} 