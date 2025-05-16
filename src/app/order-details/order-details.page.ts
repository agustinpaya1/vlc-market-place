import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService, Order } from '../services/order.service';

@Component({
  selector: 'app-order-details',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/orders"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalles del Pedido</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Estado de carga -->
      <div *ngIf="loading" class="loading-state">
        <ion-spinner></ion-spinner>
        <p>Cargando detalles del pedido...</p>
      </div>

      <!-- Estado de error -->
      <div *ngIf="error" class="error-state">
        <ion-icon name="alert-circle"></ion-icon>
        <h2>Hubo un problema</h2>
        <p>{{ error }}</p>
        <ion-button (click)="retryLoad()">
          Intentar de nuevo
        </ion-button>
      </div>

      <!-- Contenido del pedido -->
      <div *ngIf="order && !loading && !error">
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>{{ order.date | date:'dd/MM/yyyy HH:mm' }}</ion-card-subtitle>
            <ion-card-title>Pedido #{{ order.id.substring(0, 8).toUpperCase() }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
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
          </ion-card-content>
        </ion-card>

        <!-- Botón de confirmación de recepción (solo visible para pedidos pendientes) -->
        <ion-button 
          *ngIf="order.status === 'pending'" 
          expand="block" 
          color="success" 
          class="confirm-button"
          (click)="confirmOrderDelivery()">
          <ion-icon name="checkmark-circle" slot="start"></ion-icon>
          Confirmar recepción del pedido
        </ion-button>

        <!-- Tiendas -->
        <ion-card *ngIf="stores && stores.length > 0">
          <ion-card-header>
            <ion-card-title>{{ stores.length > 1 ? 'Tiendas' : 'Tienda' }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item *ngFor="let store of stores">
                <ion-avatar slot="start">
                  <img [src]="store.imageUrl || 'assets/default-store.png'" alt="Tienda" />
                </ion-avatar>
                <ion-label>
                  <h3>{{ store.name }}</h3>
                  <p>{{ store.location || 'Valencia' }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Productos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Productos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item *ngFor="let item of order.items">
                <ion-thumbnail slot="start">
                  <img [src]="item.product_info?.imageUrl || 'assets/default-product.png'" alt="Producto" />
                </ion-thumbnail>
                <ion-label>
                  <h3>{{ item.product_info?.name || 'Producto' }}</h3>
                  <p>Cantidad: {{ item.quantity }}</p>
                </ion-label>
                <ion-note slot="end">
                  {{ item.price | currency:'EUR' }}
                </ion-note>
              </ion-item>
            </ion-list>

            <div class="order-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ calculateSubtotal() | currency:'EUR' }}</span>
              </div>
              <div class="summary-row" *ngIf="order.shipping_cost">
                <span>Envío</span>
                <span>{{ order.shipping_cost | currency:'EUR' }}</span>
              </div>
              <div class="summary-row" *ngIf="order.discount">
                <span>Descuento</span>
                <span>-{{ order.discount | currency:'EUR' }}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>{{ order.total_price | currency:'EUR' }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
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

    .order-info {
      margin-bottom: 16px;
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
    }

    .confirm-button {
      margin-bottom: 16px;
      --background: var(--ion-color-success);
      font-weight: bold;
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

    .order-summary {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .summary-row.total {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--ion-color-light-shade);
      font-weight: 700;
      font-size: 18px;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class OrderDetailsPage implements OnInit {
  order: Order | null = null;
  orderId: string = '';
  loading: boolean = true;
  error: string | null = null;
  stores: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId = id;
        this.loadOrderDetails();
      } else {
        this.error = 'ID de pedido no válido';
        this.loading = false;
      }
    });
  }

  async loadOrderDetails() {
    this.loading = true;
    this.error = null;

    try {
      const order = await this.orderService.getOrderById(this.orderId);
      
      if (!order) {
        this.error = 'No se encontró el pedido';
        return;
      }
      
      this.order = order;
      this.stores = this.orderService.getStoreList(order);
      
      // Cargar info de productos para cada item
      await this.loadProductInfo();
    } catch (error) {
      console.error('Error al cargar detalles del pedido:', error);
      this.error = 'No se pudieron cargar los detalles del pedido. Por favor, intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  async loadProductInfo() {
    if (!this.order || !this.order.items) return;
    
    // Aquí podrías cargar la información detallada de cada producto
    // Por ahora, usaremos datos básicos
    this.order.items = this.order.items.map(item => {
      return {
        ...item,
        product_info: {
          name: `Producto ${item.product_id.substring(0, 4)}`,
          imageUrl: 'assets/default-product.png'
        }
      };
    });
  }

  async retryLoad() {
    await this.loadOrderDetails();
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

  calculateSubtotal(): number {
    if (!this.order || !this.order.items) return 0;
    
    return this.order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  async confirmOrderDelivery() {
    if (!this.order) return;
    
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
          handler: async () => {
            await this.markAsDelivered();
          }
        }
      ]
    });

    await alert.present();
  }

  async markAsDelivered() {
    if (!this.order) return;
    
    try {
      const success = await this.orderService.markOrderAsDelivered(this.order.id);
      
      if (success) {
        // Actualizar el estado del pedido en el componente
        this.order.status = 'delivered';
        
        // Mostrar toast de éxito
        const toast = await this.toastCtrl.create({
          message: '¡Pedido marcado como recibido correctamente!',
          duration: 3000,
          position: 'bottom',
          color: 'success',
          buttons: [
            {
              icon: 'close',
              role: 'cancel'
            }
          ]
        });
        
        await toast.present();
      } else {
        throw new Error('No se pudo actualizar el estado del pedido');
      }
    } catch (error) {
      console.error('Error al marcar pedido como entregado:', error);
      
      // Mostrar toast de error
      const toast = await this.toastCtrl.create({
        message: 'No se pudo actualizar el estado del pedido. Inténtalo de nuevo.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        buttons: [
          {
            icon: 'close',
            role: 'cancel'
          }
        ]
      });
      
      await toast.present();
    }
  }
} 