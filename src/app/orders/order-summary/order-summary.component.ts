import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Order, OrderService, OrderItem } from '../../services/order.service';

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

        <!-- Tienda -->
        <div class="store-section" *ngIf="getStoreName()">
          <h2 class="section-title">{{ getStoreCount() > 1 ? 'Tiendas' : 'Tienda' }}</h2>
          
          <!-- Múltiples tiendas -->
          <div *ngIf="getStoreCount() > 1 && order?.store_info?.stores">
            <div class="store-card" *ngFor="let store of order?.store_info?.stores; let i = index">
              <ion-icon name="storefront-outline"></ion-icon>
              <div class="store-name">{{ store.name || 'Tienda' }}</div>
            </div>
          </div>
          
          <!-- Una sola tienda -->
          <div *ngIf="getStoreCount() <= 1" class="store-card">
            <ion-icon name="storefront-outline"></ion-icon>
            <div class="store-name">{{ getStoreName() }}</div>
          </div>
        </div>

        <!-- Lista de productos -->
        <div class="products-section" *ngIf="order.items && order.items.length > 0">
          <h2 class="section-title">Productos</h2>
          
          <div class="products-list">
            <div class="product-card" *ngFor="let item of order.items">
              <div class="product-info">
                <div class="product-image-container">
                  <ion-thumbnail *ngIf="item.product_info?.image_url" class="product-image">
                    <img [src]="item.product_info?.image_url" alt="Imagen de producto">
                  </ion-thumbnail>
                  <div *ngIf="!item.product_info?.image_url" class="product-placeholder">
                    <ion-icon name="cube-outline"></ion-icon>
                  </div>
                </div>
                <div class="product-details">
                  <div class="product-name">{{ item.product_info?.name || 'Producto' }}</div>
                  <div class="product-meta">
                    <span class="product-quantity">Cantidad: {{ item.quantity }}</span>
                    <span class="product-price">{{ (item.price || 0) | currency:'EUR' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!order.items || order.items.length === 0" class="no-products-section">
          <div class="no-products-message">
            <ion-icon name="cart-outline"></ion-icon>
            <p>No hay información de productos disponible</p>
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
          <ion-button expand="block" [routerLink]="['/order-details', order.id]" (click)="dismissModal()">
            VER DETALLES COMPLETOS
          </ion-button>
          <ion-button expand="block" fill="outline" (click)="dismissModal()">
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

    .store-card ion-icon {
      font-size: 24px;
      color: var(--ion-color-primary);
    }

    .store-name {
      font-size: 16px;
      font-weight: 500;
    }

    .products-section {
      margin-bottom: 20px;
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .product-card {
      background-color: white;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.05);
    }

    .product-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .product-image-container {
      width: 50px;
      height: 50px;
      flex-shrink: 0;
    }

    .product-image {
      width: 100%;
      height: 100%;
      --border-radius: 8px;
      overflow: hidden;
    }

    .product-placeholder {
      width: 100%;
      height: 100%;
      background-color: #f0f0f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-placeholder ion-icon {
      font-size: 24px;
      color: var(--ion-color-medium);
    }

    .product-details {
      flex: 1;
    }

    .product-name {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
      color: var(--ion-color-dark);
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .product-quantity {
      font-weight: 400;
    }

    .product-price {
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    .no-products-section {
      text-align: center;
      padding: 20px;
      color: var(--ion-color-medium);
      font-style: italic;
      background-color: #f8f9fa;
      border-radius: 12px;
    }

    .no-products-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .order-info {
      margin-bottom: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .label {
      color: var(--ion-color-medium);
    }

    .value {
      font-weight: 500;
    }

    .total {
      font-weight: 700;
      color: var(--ion-color-primary);
      font-size: 18px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pending {
      background-color: var(--ion-color-warning);
      color: var(--ion-color-warning-contrast);
    }

    .status-processing {
      background-color: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
    }

    .status-shipped {
      background-color: var(--ion-color-tertiary);
      color: var(--ion-color-tertiary-contrast);
    }

    .status-delivered, .status-completed {
      background-color: var(--ion-color-success);
      color: var(--ion-color-success-contrast);
    }

    .status-canceled {
      background-color: var(--ion-color-danger);
      color: var(--ion-color-danger-contrast);
    }

    .status-paid {
      background-color: var(--ion-color-secondary);
      color: var(--ion-color-secondary-contrast);
    }

    .confirm-button {
      margin-top: 16px;
      margin-bottom: 8px;
      --background: var(--ion-color-success);
      font-weight: bold;
      --border-radius: 10px;
      height: 44px;
    }

    .action-buttons {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    ion-button {
      --border-radius: 10px;
      font-weight: 600;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class OrderSummaryComponent implements OnInit {
  @Input() orderId: string = '';
  order: Order | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    private orderService: OrderService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadOrderSummary();
  }

  async loadOrderSummary() {
    this.loading = true;
    this.error = null;

    try {
      if (!this.orderId) {
        throw new Error('ID de pedido no proporcionado');
      }

      this.order = await this.orderService.getOrderById(this.orderId);
      
      if (!this.order) {
        throw new Error('No se pudo encontrar el pedido');
      }
      
      // La información de productos ya se carga automáticamente en el método getOrderById
      
    } catch (error) {
      console.error('Error al cargar resumen del pedido:', error);
      this.error = error instanceof Error ? error.message : 'Error al cargar el pedido';
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
    if (!this.order?.store_info) return 'Tienda sin especificar';
    
    if (this.order.store_info.multiStore && this.order.store_info.stores) {
      // Si hay múltiples tiendas, mostrar el nombre de hasta 2 tiendas y cuántas más hay
      const stores = this.order.store_info.stores;
      if (stores.length === 0) return 'Tienda sin especificar';
      if (stores.length === 1) return stores[0].name || 'Tienda';
      if (stores.length === 2) return `${stores[0].name} y ${stores[1].name}`;
      return `${stores[0].name}, ${stores[1].name} y ${stores.length - 2} más`;
    } else {
      // Caso de una sola tienda
      return this.order.store_info.name || 'Tienda sin especificar';
    }
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
} 