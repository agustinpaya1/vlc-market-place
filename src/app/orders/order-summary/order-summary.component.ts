import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Order, OrderService, OrderItem } from '../../services/order.service';
import { QRCodeService } from '../../services/qr-code.service';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-order-summary',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Resumen del Pedido</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="loading" class="loading-state">
        <ion-spinner></ion-spinner>
        <p>Cargando detalles...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <ion-icon name="alert-circle"></ion-icon>
        <h2>Hubo un problema</h2>
        <p>{{ error }}</p>
        <ion-button (click)="dismissModal()">
          Cerrar
        </ion-button>
      </div>

      <!-- Contenido del resumen -->
      <div *ngIf="!loading && !error && order">
        <div class="order-header">
          <div class="order-date">{{ order.date | date:'dd/MM/yyyy HH:mm' }}</div>
          <h1 class="order-id">Pedido #{{ order.id.substring(0, 8).toUpperCase() }}</h1>
          
          <div class="order-info">
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="value status-badge" [ngClass]="'status-' + order.status">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Total:</span>
              <span class="value total">{{ order.total_price | currency:'EUR' }}</span>
            </div>
          </div>
        </div>

        <!-- QR Code para pedidos pendientes -->
        <div class="qr-section" *ngIf="order.status === 'pending' && qrCodeData">
          <h2 class="section-title">Código QR para recoger</h2>
          <div class="qr-container">
            <qrcode 
              [qrdata]="qrCodeData"
              [width]="200"
              [errorCorrectionLevel]="'H'"
              [title]="'QR Code para pedido #' + order.id"
            ></qrcode>
            <p class="qr-instructions">Muestra este código QR en el establecimiento para recoger tu pedido</p>
            <p class="qr-order-id">Pedido #{{ order.id.substring(0, 8).toUpperCase() }}</p>
          </div>
        </div>

        <!-- Tienda -->
        <div class="store-section" *ngIf="getStoreName()">
          <h2 class="section-title">{{ getStoreCount() > 1 ? 'Tiendas' : 'Tienda' }}</h2>
          
          <!-- Múltiples tiendas -->
          <div *ngIf="getStoreCount() > 1 && order?.store_info?.stores">
            <div class="store-card" *ngFor="let store of order?.store_info?.stores; let i = index">
              <div class="store-icon-container">
                <ion-icon name="storefront"></ion-icon>
              </div>
              <div class="store-name">{{ getStoreNameFromId(store.id) }}</div>
            </div>
          </div>
          
          <!-- Una sola tienda -->
          <div *ngIf="getStoreCount() <= 1" class="store-card">
            <div class="store-icon-container">
              <ion-icon name="storefront"></ion-icon>
            </div>
            <div class="store-name">{{ getStoreName() }}</div>
          </div>
        </div>

        <!-- Botón de confirmación de recepción (solo visible para pedidos pendientes) -->
        <ion-button 
          *ngIf="order.status === 'pending'" 
          expand="block" 
          color="success" 
          class="confirm-button"
          (click)="confirmOrderDelivery()">
          <ion-icon name="checkmark-circle" slot="start"></ion-icon>
          CONFIRMAR RECEPCIÓN DEL PEDIDO
        </ion-button>

        <!-- Botones de acción -->
        <div class="action-buttons">
          <ion-button expand="block" fill="outline" (click)="dismissModal()">
            <ion-icon name="close-circle-outline" slot="start"></ion-icon>
            CERRAR
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-toolbar {
      --border-radius: 0 0 16px 16px;
    }
    
    .loading-state, .error-state {
      text-align: center;
      margin-top: 40px;
      padding: 20px;

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
      }

      ion-spinner {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      h2 {
        margin: 20px 0 10px;
        color: var(--ion-color-dark);
      }

      p {
        color: var(--ion-color-medium);
        margin-bottom: 20px;
      }
    }

    .error-state ion-icon {
      color: var(--ion-color-danger);
    }

    .order-header {
      background-color: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .order-date {
      color: var(--ion-color-medium);
      font-size: 14px;
      margin-bottom: 4px;
    }

    .order-id {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 16px;
      color: var(--ion-color-dark);
    }

    .qr-section {
      margin-bottom: 20px;
      text-align: center;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 16px;
      
      img {
        width: 200px;
        height: 200px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
    }

    .qr-instructions {
      color: var(--ion-color-medium);
      font-size: 14px;
      text-align: center;
      margin: 0;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px;
      color: var(--ion-color-dark);
    }

    .store-section {
      margin-bottom: 20px;
    }

    .store-card {
      background-color: #f8f9fa;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .store-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background-color: rgba(var(--ion-color-primary-rgb), 0.15);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .store-card ion-icon {
      font-size: 22px;
      color: var(--ion-color-primary);
    }

    .store-name {
      font-size: 16px;
      font-weight: 500;
    }

    .order-info {
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .label {
          color: var(--ion-color-medium);
        }
        
        .value {
          font-weight: 500;
          
          &.status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 14px;
            
            &.status-pending {
              background-color: rgba(var(--ion-color-warning-rgb), 0.15);
              color: var(--ion-color-warning-shade);
            }
            
            &.status-delivered {
              background-color: rgba(var(--ion-color-success-rgb), 0.15);
              color: var(--ion-color-success-shade);
            }
          }
          
          &.total {
            color: var(--ion-color-dark);
            font-size: 18px;
            font-weight: 600;
          }
        }
      }
    }

    .confirm-button {
      margin: 20px 0;
    }

    .action-buttons {
      margin-top: 20px;
    }

    .qr-order-id {
      font-weight: 600;
      color: var(--ion-color-dark);
      margin-top: 8px;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, QRCodeComponent]
})
export class OrderSummaryComponent implements OnInit {
  @Input() orderId: string = '';
  order: Order | null = null;
  loading: boolean = true;
  error: string | null = null;
  qrCodeData: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    private orderService: OrderService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private qrCodeService: QRCodeService
  ) {}

  ngOnInit() {
    this.loadOrderSummary();
  }

  async loadOrderSummary() {
    try {
      this.loading = true;
      this.error = null;
      
      // Cargar detalles del pedido
      const orderDetails = await this.orderService.getOrderById(this.orderId);
      if (!orderDetails) {
        throw new Error('No se pudo encontrar el pedido');
      }
      this.order = orderDetails;

      // Si el pedido está pendiente, cargar el QR
      if (this.order.status === 'pending') {
        try {
          const qrCode = await this.qrCodeService.getQRCodeByOrderId(this.orderId);
          if (qrCode) {
            // Crear un objeto con los datos necesarios para el QR
            const qrData = {
              orderId: qrCode.order_id,
              code: qrCode.code,
              publicKey: qrCode.public_key,
              timestamp: new Date().toISOString()
            };
            this.qrCodeData = JSON.stringify(qrData);
          } else {
            console.warn('No se encontró el código QR para el pedido:', this.orderId);
          }
        } catch (qrError) {
          console.error('Error al cargar el QR:', qrError);
          // No mostramos error al usuario ya que el QR es opcional
        }
      }
    } catch (error) {
      console.error('Error al cargar el resumen del pedido:', error);
      this.error = 'No se pudo cargar el resumen del pedido';
    } finally {
      this.loading = false;
    }
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'processing': 'En preparación',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'canceled': 'Cancelado',
      'completed': 'Completado',
      'paid': 'Pagado'
    };
    
    return statusMap[status] || status;
  }

  getItemCount(): number {
    return this.order?.items?.length || 0;
  }

  getStoreName(): string {
    if (!this.order?.store_info) return 'Tienda local';
    
    // Si hay un ID directo en store_info
    if (this.order.store_info.id) {
      // 'Frutas Manolo' siempre debe aparecer para el ID correcto
      if (this.order.store_info.id === 'cb4e8dd3-3605-4649-ab10-10f980c88f74') {
        return 'Frutas Manolo';
      }
      
      // Para otros IDs, mostrar nombres amigables según el ID
      const storeId = this.order.store_info.id;
      
      // Si comienza con a6b7, es una tienda de frutas
      if (storeId.startsWith('a6b7d3')) {
        return 'Frutas Manolo';
      }
      
      // Para otros casos específicos
      if (storeId.startsWith('bb7fa6')) {
        return 'Tienda Central';
      }
      
      if (storeId.startsWith('6604b1')) {
        return 'Mercado Fresco';
      }
      
      if (storeId.startsWith('070215')) {
        return 'Supermercado VLC';
      }
      
      // Para cualquier otro ID, un nombre genérico de tienda
      return 'Tienda local';
    }
    
    // Si hay datos de multiStore, mostrar nombres amigables
    if (this.order.store_info.multiStore && this.order.store_info.stores && this.order.store_info.stores.length > 0) {
      // Obtener nombres para las primeras tiendas
      const storeNames = this.order.store_info.stores.map((store: any) => {
        const storeId = store.id;
        
        if (storeId === 'cb4e8dd3-3605-4649-ab10-10f980c88f74' || storeId.startsWith('a6b7d3')) {
          return 'Frutas Manolo';
        }
        if (storeId.startsWith('bb7fa6')) {
          return 'Tienda Central';
        }
        if (storeId.startsWith('6604b1')) {
          return 'Mercado Fresco';
        }
        if (storeId.startsWith('070215')) {
          return 'Supermercado VLC';
        }
        
        return 'Tienda local';
      });
      
      // Si hay más de una tienda
      if (storeNames.length > 1) {
        return `${storeNames[0]} y ${storeNames.length - 1} más`;
      }
      
      // Solo una tienda
      return storeNames[0];
    }
    
    // Valor predeterminado más amigable
    return 'Tienda local';
  }

  getStoreCount(): number {
    if (!this.order?.store_info) return 0;
    
    if (this.order.store_info.multiStore && this.order.store_info.stores) {
      return this.order.store_info.stores.length;
    } else {
      // Si es una sola tienda sin array de stores
      return 1;
    }
  }

  async confirmOrderDelivery() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar recepción',
      message: '¿Confirmas que has recibido este pedido correctamente?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.markAsDelivered();
          }
        }
      ]
    });

    await alert.present();
  }

  async markAsDelivered() {
    if (!this.order) return;
    
    const success = await this.orderService.markOrderAsDelivered(this.order.id);
    
    if (success) {
      if (this.order) {
        this.order.status = 'delivered';
      }
      
      const toast = await this.toastCtrl.create({
        message: 'Pedido marcado como recibido',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      
      await toast.present();
    } else {
      const toast = await this.toastCtrl.create({
        message: 'No se pudo actualizar el estado del pedido',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      
      await toast.present();
    }
  }

  // Helper para obtener nombre amigable de tienda por ID
  getStoreNameFromId(storeId: string): string {
    if (!storeId) return 'Tienda local';
    
    if (storeId === 'cb4e8dd3-3605-4649-ab10-10f980c88f74' || storeId.startsWith('a6b7d3')) {
      return 'Frutas Manolo';
    }
    if (storeId.startsWith('bb7fa6')) {
      return 'Tienda Central';
    }
    if (storeId.startsWith('6604b1')) {
      return 'Mercado Fresco';
    }
    if (storeId.startsWith('070215')) {
      return 'Supermercado VLC';
    }
    
    return 'Tienda local';
  }
} 