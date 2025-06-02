import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonBadge,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  ToastController
} from '@ionic/angular/standalone';
import { StoreService } from '../../services/store.service';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircle,
  timeOutline,
  closeCircle,
  bicycle
} from 'ionicons/icons';

interface Order {
  id: string;
  store_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  created_at: string;
  items: OrderItem[];
  shipping_address?: string;
  payment_status: 'pending' | 'paid' | 'failed';
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-store-orders',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/store-management"></ion-back-button>
        </ion-buttons>
        <ion-title>Pedidos de la Tienda</ion-title>
      </ion-toolbar>

      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedStatus" (ionChange)="filterOrders()">
          <ion-segment-button value="all">
            <ion-label>Todos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pending">
            <ion-label>Pendientes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="processing">
            <ion-label>En Proceso</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completados</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="isLoading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Cargando pedidos...</p>
      </div>

      <ion-list *ngIf="!isLoading">
        <ion-item *ngFor="let order of filteredOrders" class="order-item">
          <ion-label>
            <div class="order-header">
              <h2>Pedido #{{ order.id }}</h2>
              <ion-badge [color]="getStatusColor(order.status)">
                {{ getStatusText(order.status) }}
              </ion-badge>
            </div>
            
            <p class="order-date">
              {{ order.created_at | date:'dd/MM/yyyy HH:mm' }}
            </p>
            
            <div class="order-items">
              <p *ngFor="let item of order.items">
                {{ item.quantity }}x {{ item.product_name }}
                <span class="item-price">
                  {{ item.price * item.quantity | currency:'EUR':'symbol':'1.2-2' }}
                </span>
              </p>
            </div>
            
            <div class="order-footer">
              <strong>Total: {{ order.total | currency:'EUR':'symbol':'1.2-2' }}</strong>
              <ion-badge [color]="getPaymentStatusColor(order.payment_status)">
                {{ getPaymentStatusText(order.payment_status) }}
              </ion-badge>
            </div>
          </ion-label>

          <div slot="end" class="order-actions">
            <ion-button 
              *ngIf="order.status === 'pending'"
              fill="clear"
              color="primary"
              (click)="processOrder(order)">
              <ion-icon slot="icon-only" name="bicycle"></ion-icon>
            </ion-button>
            
            <ion-button 
              *ngIf="order.status === 'processing'"
              fill="clear"
              color="success"
              (click)="completeOrder(order)">
              <ion-icon slot="icon-only" name="checkmark-circle"></ion-icon>
            </ion-button>
            
            <ion-button 
              *ngIf="order.status === 'pending' || order.status === 'processing'"
              fill="clear"
              color="danger"
              (click)="cancelOrder(order)">
              <ion-icon slot="icon-only" name="close-circle"></ion-icon>
            </ion-button>
          </div>
        </ion-item>

        <!-- Mensaje cuando no hay pedidos -->
        <div *ngIf="filteredOrders.length === 0" class="ion-text-center ion-padding empty-state">
          <ion-icon name="receipt" style="font-size: 48px; color: var(--ion-color-medium)"></ion-icon>
          <h2>No hay pedidos {{ getEmptyStateText() }}</h2>
          <p>Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
        </div>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --padding: 16px;
    }

    .order-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        h2 {
          font-weight: 600;
          font-size: 16px;
          margin: 0;
        }
      }

      .order-date {
        color: var(--ion-color-medium);
        font-size: 14px;
        margin-bottom: 8px;
      }

      .order-items {
        margin: 8px 0;
        
        p {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
          color: var(--ion-color-dark);
          
          .item-price {
            color: var(--ion-color-medium);
          }
        }
      }

      .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        
        strong {
          font-size: 16px;
        }
      }

      .order-actions {
        display: flex;
        gap: 8px;
      }
    }

    ion-badge {
      padding: 4px 8px;
      border-radius: 4px;
    }

    .empty-state {
      padding: 32px 16px;

      ion-icon {
        margin-bottom: 16px;
      }

      h2 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      p {
        color: var(--ion-color-medium);
        font-size: 16px;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonBadge,
    IonIcon,
    IonSegment,
    IonSegmentButton
  ]
})
export class StoreOrdersPage implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  storeId: string | null = null;
  selectedStatus: 'all' | 'pending' | 'processing' | 'completed' = 'all';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storeService: StoreService,
    private toastController: ToastController
  ) {
    addIcons({
      checkmarkCircle,
      timeOutline,
      closeCircle,
      bicycle
    });
  }

  async ngOnInit() {
    this.storeId = this.route.snapshot.paramMap.get('id');
    if (!this.storeId) {
      await this.showToast('ID de tienda no válido', 'danger');
      this.router.navigate(['/tabs/store-management']);
      return;
    }

    await this.loadOrders();
  }

  async loadOrders() {
    try {
      // Aquí implementarías la carga de pedidos desde el servicio
      // this.orders = await this.storeService.getStoreOrders(this.storeId);
      
      // Por ahora usamos datos de ejemplo
      this.orders = [
        {
          id: '1',
          store_id: this.storeId!,
          user_id: 'user1',
          status: 'pending',
          total: 39.98,
          created_at: new Date().toISOString(),
          items: [
            {
              product_id: '1',
              product_name: 'Producto 1',
              quantity: 2,
              price: 19.99
            }
          ],
          payment_status: 'paid'
        },
        {
          id: '2',
          store_id: this.storeId!,
          user_id: 'user2',
          status: 'processing',
          total: 29.99,
          created_at: new Date().toISOString(),
          items: [
            {
              product_id: '2',
              product_name: 'Producto 2',
              quantity: 1,
              price: 29.99
            }
          ],
          payment_status: 'pending'
        }
      ];
      
      this.filterOrders();
    } catch (error) {
      console.error('Error al cargar los pedidos:', error);
      await this.showToast('Error al cargar los pedidos', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  filterOrders() {
    this.filteredOrders = this.selectedStatus === 'all'
      ? this.orders
      : this.orders.filter(order => order.status === this.selectedStatus);
  }

  getStatusColor(status: Order['status']): string {
    const colors = {
      pending: 'warning',
      processing: 'primary',
      completed: 'success',
      cancelled: 'danger'
    };
    return colors[status];
  }

  getStatusText(status: Order['status']): string {
    const texts = {
      pending: 'Pendiente',
      processing: 'En Proceso',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    return texts[status];
  }

  getPaymentStatusColor(status: Order['payment_status']): string {
    const colors = {
      pending: 'warning',
      paid: 'success',
      failed: 'danger'
    };
    return colors[status];
  }

  getPaymentStatusText(status: Order['payment_status']): string {
    const texts = {
      pending: 'Pago Pendiente',
      paid: 'Pagado',
      failed: 'Pago Fallido'
    };
    return texts[status];
  }

  getEmptyStateText(): string {
    if (this.selectedStatus === 'all') return '';
    return this.getStatusText(this.selectedStatus).toLowerCase();
  }

  async processOrder(order: Order) {
    try {
      // Aquí implementarías el procesamiento del pedido
      order.status = 'processing';
      await this.showToast('Pedido en proceso', 'success');
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      await this.showToast('Error al procesar el pedido', 'danger');
    }
  }

  async completeOrder(order: Order) {
    try {
      // Aquí implementarías la finalización del pedido
      order.status = 'completed';
      await this.showToast('Pedido completado', 'success');
    } catch (error) {
      console.error('Error al completar el pedido:', error);
      await this.showToast('Error al completar el pedido', 'danger');
    }
  }

  async cancelOrder(order: Order) {
    try {
      // Aquí implementarías la cancelación del pedido
      order.status = 'cancelled';
      await this.showToast('Pedido cancelado', 'danger');
    } catch (error) {
      console.error('Error al cancelar el pedido:', error);
      await this.showToast('Error al cancelar el pedido', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
} 