import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Order, OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-summary',
  template: `
    <ion-header>
      <ion-toolbar>
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

        <!-- Mini lista de productos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Productos ({{ getItemCount() }})</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item *ngFor="let item of order.items.slice(0, 3)">
                <ion-label>
                  <h3>{{ item.product_info?.name || 'Producto' }}</h3>
                  <p>Cantidad: {{ item.quantity }}</p>
                </ion-label>
                <ion-note slot="end">
                  {{ item.price | currency:'EUR' }}
                </ion-note>
              </ion-item>
              <ion-item *ngIf="order.items.length > 3" class="more-items">
                <ion-label class="ion-text-center">
                  <p>... y {{ order.items.length - 3 }} productos más</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Tienda -->
        <ion-card *ngIf="getStoreName()">
          <ion-card-header>
            <ion-card-title>Tienda</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ getStoreName() }}</p>
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

        <!-- Botones de acción -->
        <div class="action-buttons">
          <ion-button expand="block" [routerLink]="['/order-details', order.id]" (click)="dismissModal()">
            Ver detalles completos
          </ion-button>
          <ion-button expand="block" fill="outline" (click)="dismissModal()">
            Cerrar
          </ion-button>
        </div>
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

    .more-items {
      font-style: italic;
      color: var(--ion-color-medium);
    }

    .confirm-button {
      margin-top: 16px;
      margin-bottom: 8px;
      --background: var(--ion-color-success);
      font-weight: bold;
    }

    .action-buttons {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
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
    if (!this.orderId) {
      this.error = 'ID de pedido no válido';
      this.loading = false;
      return;
    }

    try {
      this.order = await this.orderService.getOrderById(this.orderId);
      
      if (!this.order) {
        this.error = 'No se encontró el pedido';
      }
    } catch (error) {
      console.error('Error al cargar resumen del pedido:', error);
      this.error = 'No se pudieron cargar los detalles del pedido';
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
    if (!this.order || !this.order.store_info) return '';
    
    const stores = this.orderService.getStoreList(this.order);
    if (stores.length === 0) return '';
    if (stores.length === 1) return stores[0].name || 'Tienda';
    return 'Varias tiendas';
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