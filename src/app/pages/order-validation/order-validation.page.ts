import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { QrScannerService } from '../../services/qr-scanner.service';
import { OrderService } from '../../services/order.service';
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
    public platform: Platform
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
      this.scannerPermission = await this.qrScanner.checkPermission();
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
      // El QR debería contener el ID del pedido
      const orderId = qrContent;
      
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

      // Verificar que el pedido pertenece a esta tienda
      if (order.store_id !== this.storeId) {
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

      // Marcar el pedido como entregado
      const success = await this.orderService.markOrderAsDelivered(orderId);
      
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
      this.notificationService.show({
        message: 'Error al procesar el código QR',
        type: 'error',
        duration: 3000
      });
    }
  }
} 