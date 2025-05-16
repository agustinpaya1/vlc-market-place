import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ModalController, AnimationController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { OrderService, Order } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="header-toolbar">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Mis Pedidos</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp()">
            <ion-icon name="help-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="orders-content">
      <!-- Estado de carga -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
        <p>Cargando tus pedidos...</p>
      </div>

      <!-- Estado de error -->
      <div *ngIf="error" class="error-state">
        <div class="error-icon">
          <ion-icon name="alert-circle"></ion-icon>
        </div>
        <h2>Hubo un problema</h2>
        <p>{{ error }}</p>
        <ion-button (click)="retryLoad()" class="retry-button">
          <ion-icon name="refresh-outline" slot="start"></ion-icon>
          Intentar de nuevo
        </ion-button>
        <ion-button *ngIf="showLoginButton" (click)="goToLogin()" color="secondary" class="login-button">
          <ion-icon name="log-in-outline" slot="start"></ion-icon>
          Iniciar sesión
        </ion-button>
      </div>

      <!-- Filtros -->
      <div *ngIf="!loading && !error && orders.length > 0" class="filters-segment">
        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="filterOrders()" mode="ios">
          <ion-segment-button value="all">
            <ion-label>Todos</ion-label>
            <ion-badge>{{orders.length}}</ion-badge>
          </ion-segment-button>
          <ion-segment-button value="pending">
            <ion-label>Pendientes</ion-label>
            <ion-badge color="warning">{{getPendingCount()}}</ion-badge>
          </ion-segment-button>
          <ion-segment-button value="delivered">
            <ion-label>Entregados</ion-label>
            <ion-badge color="success">{{getDeliveredCount()}}</ion-badge>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Lista de pedidos -->
      <div class="orders-container" *ngIf="!loading && !error && filteredOrders.length > 0">
        <div class="orders-list">
          <div class="order-card" *ngFor="let order of filteredOrders; let i = index" 
               (click)="showOrderSummary(order.id)">
            <div class="order-header" [ngClass]="{'delivered': order.status === 'delivered', 'pending': order.status === 'pending'}">
              <div class="order-id">
                <h2># {{order.id.substring(0, 8).toUpperCase()}}</h2>
              </div>
              <div class="order-status">
                <ion-badge [color]="getStatusColor(order.status)" class="status-badge">
                  {{ getStatusLabel(order.status) }}
                </ion-badge>
              </div>
            </div>
            
            <div class="order-content">
              <div class="order-info">
                <div class="info-row">
                  <ion-icon name="calendar-outline"></ion-icon>
                  <span>{{ order.date | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="info-row" *ngIf="getStoreNames(order)">
                  <ion-icon name="storefront-outline"></ion-icon>
                  <span>{{ getStoreNames(order) }}</span>
                </div>
                <div class="info-row" *ngIf="getItemCount(order) > 0">
                  <ion-icon name="bag-outline"></ion-icon>
                  <span>{{ getItemCount(order) }} productos</span>
                </div>
              </div>
              
              <div class="order-price">
                <span class="price-label">Total</span>
                <span class="price-value">{{ order.total_price | currency:'EUR' }}</span>
              </div>
            </div>

            <div class="order-actions" *ngIf="order.status === 'pending'">
              <ion-button 
                class="receive-button" 
                color="success" 
                (click)="confirmOrderDelivery(order.id, $event)">
                <ion-icon name="checkmark-circle" slot="start"></ion-icon>
                Marcar como recibido
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div *ngIf="!loading && !error && orders.length === 0" class="empty-state">
        <div class="empty-animation">
          <ion-icon name="bag"></ion-icon>
        </div>
        <h2>No tienes pedidos</h2>
        <p>Tus pedidos aparecerán aquí cuando realices una compra</p>
        <ion-button routerLink="/tabs/stores" class="explore-button">
          <ion-icon name="storefront" slot="start"></ion-icon>
          Explorar tiendas
        </ion-button>
      </div>

      <!-- Estado de filtro sin resultados -->
      <div *ngIf="!loading && !error && orders.length > 0 && filteredOrders.length === 0" class="empty-filter">
        <ion-icon name="funnel-outline"></ion-icon>
        <h3>No hay pedidos que coincidan con el filtro</h3>
        <ion-button fill="clear" (click)="resetFilter()" class="show-all-button">
          <ion-icon name="eye-outline" slot="start"></ion-icon>
          Ver todos los pedidos
        </ion-button>
      </div>

      <!-- Sección de ayuda fija -->
      <div class="help-section">
        <ion-button fill="clear" size="small" (click)="showHelp()" class="help-button">
          <ion-icon name="help-circle" slot="start"></ion-icon>
          ¿Necesitas ayuda con tus pedidos?
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --border-radius-medium: 14px;
      --border-radius-large: 20px;
      --shadow-small: 0 2px 6px rgba(0, 0, 0, 0.06);
      --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.08);
      --accent-color: var(--ion-color-primary);
      --pending-color: #ffb74d;
      --delivered-color: #66bb6a;
    }

    .header-toolbar {
      --background: var(--ion-color-primary);
      --border-radius: 0 0 20px 20px;
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.2);
      height: 60px;
    }

    ion-title {
      font-size: 20px;
      font-weight: 600;
    }

    .orders-content {
      --background: #f8fafc;
    }

    .filters-segment {
      padding: 16px 16px 12px;
      background: white;
      margin: 12px 12px 16px;
      border-radius: var(--border-radius-medium);
      box-shadow: var(--shadow-small);
    }

    ion-segment {
      --background: rgba(var(--ion-color-light-rgb), 0.7);
      border-radius: var(--border-radius-large);
      padding: 4px;
    }

    ion-segment-button {
      --background-checked: white;
      --color-checked: var(--ion-color-primary);
      --indicator-color: transparent;
      min-height: 40px;
      --border-radius: var(--border-radius-medium);
      --padding-top: 6px;
      --padding-bottom: 6px;
      text-transform: none;
      font-weight: 600;
      letter-spacing: -0.2px;
    }

    ion-badge {
      margin-left: 6px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .orders-container {
      padding: 0 16px 24px;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-card {
      background: white;
      border-radius: var(--border-radius-large);
      overflow: hidden;
      box-shadow: var(--shadow-small);
      position: relative;
      border: 1px solid rgba(0, 0, 0, 0.03);
    }

    .order-card:active {
      transform: scale(0.98);
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: rgba(var(--ion-color-primary-rgb), 0.08);
      border-bottom: 1px solid rgba(var(--ion-color-medium-rgb), 0.1);
    }

    .order-header.delivered {
      background-color: rgba(var(--ion-color-success-rgb), 0.12);
      border-left: 4px solid var(--delivered-color);
    }

    .order-header.pending {
      background-color: rgba(var(--ion-color-warning-rgb), 0.12);
      border-left: 4px solid var(--pending-color);
    }

    .order-id h2 {
      margin: 0;
      font-weight: 700;
      color: var(--ion-color-dark);
      font-size: 16px;
      letter-spacing: -0.3px;
    }

    .order-status .status-badge {
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 20px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -0.2px;
    }

    .order-content {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .info-row ion-icon {
      font-size: 18px;
      color: var(--accent-color);
    }

    .order-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .price-label {
      font-size: 12px;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .price-value {
      font-weight: 700;
      font-size: 20px;
      color: var(--ion-color-dark);
      letter-spacing: -0.5px;
    }

    .order-actions {
      padding: 0 16px 16px;
      display: flex;
      justify-content: flex-end;
    }

    .receive-button {
      --border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      --box-shadow: 0 2px 6px rgba(var(--ion-color-success-rgb), 0.3);
      height: 36px;
    }

    .receive-button ion-icon {
      font-size: 16px;
      margin-right: 4px;
    }

    .empty-state, .loading-state, .error-state {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
    }

    .spinner-container {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .spinner-container ion-spinner {
      width: 32px;
      height: 32px;
      --color: var(--ion-color-primary);
    }

    .error-icon {
      width: 80px;
      height: 80px;
      background: rgba(var(--ion-color-danger-rgb), 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .error-icon ion-icon {
      font-size: 48px;
      color: var(--ion-color-danger);
    }

    .empty-animation {
      width: 80px;
      height: 80px;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .empty-animation ion-icon {
      font-size: 40px;
      color: var(--ion-color-primary);
    }

    .empty-state h2, 
    .error-state h2 {
      margin: 0 0 10px;
      color: var(--ion-color-dark);
      font-size: 20px;
      font-weight: 600;
    }

    .empty-state p, 
    .loading-state p, 
    .error-state p {
      color: var(--ion-color-medium);
      margin-bottom: 24px;
      max-width: 280px;
      line-height: 1.5;
    }

    .explore-button {
      --background: var(--ion-color-primary);
      --border-radius: 14px;
      --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
      font-weight: 600;
      height: 44px;
      --padding-start: 20px;
      --padding-end: 20px;
      margin-top: 12px;
    }

    .retry-button, .login-button {
      --border-radius: 14px;
      height: 44px;
      font-weight: 600;
      margin: 0 8px;
    }

    .empty-filter {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-medium);
    }

    .empty-filter ion-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--ion-color-medium);
    }

    .empty-filter h3 {
      font-weight: 600;
      color: var(--ion-color-dark);
      margin-bottom: 16px;
    }

    .show-all-button {
      --color: var(--ion-color-primary);
      font-weight: 600;
    }

    .help-section {
      position: fixed;
      bottom: 16px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      z-index: 10;
    }

    .help-button {
      --background: rgba(var(--ion-color-primary-rgb), 0.15);
      --color: var(--ion-color-primary);
      --border-radius: 24px;
      --padding-start: 18px;
      --padding-end: 18px;
      font-weight: 600;
      height: 40px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    :host ::ng-deep .help-selection-alert .alert-wrapper {
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    }

    :host ::ng-deep .help-selection-alert .alert-button {
      color: var(--ion-color-primary);
      margin: 8px 0;
      border-radius: 12px;
      font-weight: 600;
    }

    :host ::ng-deep .help-instructions-alert .quick-help {
      text-align: left;
      margin: 16px 0;
    }

    :host ::ng-deep .help-instructions-alert .help-item {
      padding: 12px;
      margin-bottom: 10px;
      background-color: rgba(var(--ion-color-primary-rgb), 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
    }

    :host ::ng-deep .help-instructions-alert .help-item strong {
      display: inline-block;
      width: 28px;
      height: 28px;
      background-color: var(--ion-color-primary);
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 28px;
      margin-right: 12px;
      font-weight: 700;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, OrderSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  error: string | null = null;
  showLoginButton = false;
  selectedFilter: string = 'all';

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private router: Router,
    private animationCtrl: AnimationController,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    this.error = null;
    this.showLoginButton = false;
    this.cdr.markForCheck();

    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.loading = false;
      this.error = 'Necesitas iniciar sesión para ver tus pedidos';
      this.showLoginButton = true;
      this.cdr.markForCheck();
      return;
    }

    try {
      this.orders = await this.orderService.getUserOrders();
      this.filterOrders();
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      this.error = 'No se pudieron cargar tus pedidos. Por favor, intenta de nuevo.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  filterOrders() {
    if (this.selectedFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else if (this.selectedFilter === 'pending') {
      this.filteredOrders = this.orders.filter(order => order.status === 'pending');
    } else if (this.selectedFilter === 'delivered') {
      this.filteredOrders = this.orders.filter(order => order.status === 'delivered');
    }
    this.cdr.markForCheck();
  }

  getPendingCount(): number {
    return this.orders.filter(order => order.status === 'pending').length;
  }

  getDeliveredCount(): number {
    return this.orders.filter(order => order.status === 'delivered').length;
  }

  getItemCount(order: Order): number {
    return order.items?.length || 0;
  }

  resetFilter() {
    this.selectedFilter = 'all';
    this.filterOrders();
  }

  async retryLoad() {
    await this.loadOrders();
  }

  goToLogin() {
    // Redirigir a la página de login
    window.location.href = '/login';
  }

  getStatusColor(status: string): string {
    const statusColorMap: { [key: string]: string } = {
      'pending': 'warning',
      'processing': 'primary',
      'shipped': 'tertiary',
      'delivered': 'success',
      'canceled': 'danger',
      'completed': 'success',
      'paid': 'secondary'
    };
    
    return statusColorMap[status] || 'medium';
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

  getStoreNames(order: Order): string {
    if (!order.store_info) return '';
    
    // Obtener la lista de tiendas del pedido
    const stores = this.orderService.getStoreList(order);
    
    if (stores.length === 0) return '';
    if (stores.length === 1) return stores[0].name || 'Tienda';
    
    // Si hay más de una tienda, mostrar "Varias tiendas"
    return 'Varias tiendas';
  }

  async showOrderSummary(orderId: string) {
    const modal = await this.modalCtrl.create({
      component: OrderSummaryComponent,
      componentProps: {
        orderId: orderId
      },
      cssClass: 'order-summary-modal',
      backdropDismiss: true,
      animated: true
    });

    await modal.present();
  }

  async confirmOrderDelivery(orderId: string, event: Event) {
    event.stopPropagation(); // Evitar que se abra el modal al mismo tiempo
    
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
            const success = await this.orderService.markOrderAsDelivered(orderId);
            
            if (success) {
              // Actualizar el estado del pedido en la lista local
              this.orders = this.orders.map(order => {
                if (order.id === orderId) {
                  return { ...order, status: 'delivered' };
                }
                return order;
              });
              
              // Actualizar filtros
              this.filterOrders();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showHelp() {
    const alert = await this.alertCtrl.create({
      header: 'Ayuda con tus Pedidos',
      message: `
        <h2>¿Qué quieres hacer?</h2>
        <p>Selecciona una de las siguientes opciones:</p>
      `,
      buttons: [
        {
          text: 'Ver instrucciones',
          handler: () => {
            this.showHelpInstructions();
          }
        },
        {
          text: 'Ir a centro de ayuda',
          handler: () => {
            this.router.navigate(['/order-help']);
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ],
      cssClass: 'help-selection-alert'
    });

    await alert.present();
  }

  async showHelpInstructions() {
    const alert = await this.alertCtrl.create({
      header: 'Guía rápida de pedidos',
      message: `
        <div class="quick-help">
          <div class="help-item">
            <strong>1.</strong> Navega por la lista de tus pedidos
          </div>
          <div class="help-item">
            <strong>2.</strong> Toca un pedido para ver su resumen
          </div>
          <div class="help-item">
            <strong>3.</strong> Si tu pedido está en estado "Pendiente", puedes confirmarlo con el botón verde
          </div>
          <div class="help-item">
            <strong>4.</strong> Para más detalles, selecciona "Ver detalles completos"
          </div>
        </div>
      `,
      buttons: ['Entendido'],
      cssClass: 'help-instructions-alert'
    });

    await alert.present();
  }
} 