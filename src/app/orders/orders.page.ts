import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ModalController, AnimationController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { OrderService, Order, OrderItem } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { Router } from '@angular/router';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-orders',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary" class="header-toolbar">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title class="ion-text-center" (click)="handleTitleClick($event)">
          Mis Pedidos
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp()">
            <ion-icon name="help-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="orders-content">
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="refreshOrders($event)">
        <ion-refresher-content
          pullingIcon="chevron-down-outline"
          pullingText="Desliza para actualizar"
          refreshingSpinner="circles"
          refreshingText="Actualizando...">
        </ion-refresher-content>
      </ion-refresher>

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

      <!-- Introductor del apartado -->
      <div *ngIf="!loading && !error" class="orders-intro">
        <div class="intro-card">
          <div class="app-logo">
            <ion-icon name="storefront" class="market-icon-large"></ion-icon>
          </div>
          <h2>Tus Pedidos</h2>
          <p>Gestiona e haz seguimiento a todos tus pedidos</p>
        </div>
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
                <div class="info-row">
                  <div class="store-icon-container">
                    <ion-icon name="storefront"></ion-icon>
                  </div>
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

            <!-- Productos destacados del pedido -->
            <div class="order-products" *ngIf="order.items && order.items.length > 0">
              <div class="product-preview" *ngFor="let item of order.items.slice(0, 3)">
                <div class="product-image-container">
                  <ion-thumbnail *ngIf="item.product_info?.image_url" class="product-image">
                    <img [src]="item.product_info?.image_url" alt="Imagen de producto">
                  </ion-thumbnail>
                  <div *ngIf="!item.product_info?.image_url" class="product-placeholder">
                    <ion-icon name="cube-outline"></ion-icon>
                  </div>
                </div>
                <div class="product-info">
                  <span class="product-name">{{ item.product_info?.name || 'Producto' }}</span>
                  <span class="product-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
              <div class="more-products" *ngIf="order.items.length > 3">
                <span>+{{ order.items.length - 3 }} más</span>
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
              <ion-button 
                class="qr-button" 
                color="primary" 
                [routerLink]="['/pickup', order.id]"
                [queryParams]="{ orderId: order.id }"
                (click)="$event.stopPropagation()">
                <ion-icon name="qr-code-outline" slot="start"></ion-icon>
                Ver QR para recoger
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div *ngIf="!loading && !error && orders.length === 0" class="empty-state">
        <div class="empty-animation">
          <ion-icon name="bag-handle"></ion-icon>
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
          <div class="help-icon-container">
            <ion-icon name="help-circle"></ion-icon>
          </div>
          <span>¿Necesitas ayuda con tus pedidos?</span>
        </ion-button>
      </div>

      <!-- Flotante de ayuda para incidencias -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="help-fab">
        <ion-fab-button color="tertiary" (click)="showIncidentsHelp()">
          <div class="help-question-icon-container">
            <span class="help-question-mark">?</span>
          </div>
        </ion-fab-button>
      </ion-fab>
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
      --background-gradient: linear-gradient(180deg, #f5fdfd 0%, #e7f5f9 100%);
      --card-background: #ffffff;
    }

    .header-toolbar {
      --background: var(--ion-color-primary);
      --border-radius: 0 0 20px 20px;
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.2);
      height: 60px;
    }

    ion-title {
      font-size: 18px;
      font-weight: 600;
    }

    .market-icon-large {
      font-size: 48px;
      color: var(--ion-color-primary);
      background: linear-gradient(135deg, rgba(var(--ion-color-primary-rgb), 0.15), rgba(var(--ion-color-success-rgb), 0.1));
      padding: 20px;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .orders-content {
      --background: var(--background-gradient);
      background-image: url('/assets/dots-pattern.svg');
      background-repeat: repeat;
      background-size: 900px;
    }

    .orders-intro {
      padding: 20px 16px 10px;
    }

    .intro-card {
      background-color: #ffffff;
      border-radius: 20px;
      padding: 16px;
      box-shadow: var(--shadow-small);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 12px;
    }
    
    .app-logo {
      width: 70px;
      height: 70px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .app-logo img {
      width: 100%;
      height: auto;
    }

    .intro-card ion-icon {
      font-size: 32px;
      color: var(--ion-color-primary);
      background-color: rgba(var(--ion-color-primary-rgb), 0.1);
      padding: 12px;
      border-radius: 50%;
      margin-bottom: 8px;
    }

    .intro-card h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 8px 0 4px;
      color: var(--ion-color-dark);
    }

    .intro-card p {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0;
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
      background: var(--card-background);
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

    .store-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background-color: rgba(var(--ion-color-primary-rgb), 0.15);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .info-row ion-icon {
      font-size: 18px;
      color: var(--accent-color);
    }

    .store-icon-container ion-icon {
      font-size: 16px;
      color: var(--ion-color-primary);
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

    .order-products {
      display: flex;
      align-items: center;
      padding: 0 16px 12px;
      gap: 10px;
      overflow-x: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .order-products::-webkit-scrollbar {
      display: none;
    }

    .product-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
      max-width: 70px;
    }

    .product-image-container {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .product-image {
      width: 100%;
      height: 100%;
      --border-radius: 8px;
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
      font-size: 22px;
      color: var(--ion-color-medium);
    }

    .product-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .product-name {
      font-size: 11px;
      color: var(--ion-color-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .product-quantity {
      font-size: 10px;
      color: var(--ion-color-medium);
    }

    .more-products {
      font-size: 11px;
      color: var(--ion-color-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
    }

    .order-actions {
      padding: 0 16px 16px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .receive-button, .qr-button {
      --border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      height: 36px;
    }

    .receive-button {
      --box-shadow: 0 2px 6px rgba(var(--ion-color-success-rgb), 0.3);
    }

    .qr-button {
      --box-shadow: 0 2px 6px rgba(var(--ion-color-primary-rgb), 0.3);
    }

    .receive-button ion-icon, .qr-button ion-icon {
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
      width: 120px;
      height: 120px;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .empty-animation ion-icon {
      font-size: 60px;
      color: var(--ion-color-primary);
    }

    .empty-state h2, 
    .error-state h2 {
      margin: 0 0 10px;
      color: var(--ion-color-dark);
      font-size: 22px;
      font-weight: 700;
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
      --border-radius: 24px;
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
      --padding-start: 12px;
      --padding-end: 18px;
      font-weight: 600;
      height: 44px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .help-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--ion-color-primary);
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      margin-right: 8px;
    }

    .help-icon-container ion-icon {
      font-size: 18px;
    }

    .help-fab {
      margin-bottom: 70px;
      margin-right: 16px;
    }

    ion-fab-button {
      --box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
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

    .incidents-help-alert .alert-sub-title {
      color: rgba(255, 255, 255, 0.9) !important;
      font-size: 16px !important;
      font-weight: 500 !important;
    }
    .incidents-help-alert .alert-message {
      max-height: 60vh !important;
      overflow-y: auto !important;
      padding: 16px !important;
    }
    .incidents-help-alert .alert-button-group {
      padding: 12px !important;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }
    .incidents-help-alert .alert-button {
      border-radius: 16px !important;
      text-transform: none !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      padding: 12px 24px !important;
      min-width: 120px !important;
      color: var(--ion-color-primary) !important;
    }
    .incidents-help-alert .alert-button.alert-button-role-cancel {
      color: var(--ion-color-medium) !important;
    }

    .help-question-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .help-question-mark {
      font-size: 2.2rem;
      font-weight: bold;
      color: white;
      line-height: 1;
      text-align: center;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
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

  private clickCount = 0;
  private clickTimer: any;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private router: Router,
    private animationCtrl: AnimationController,
    private cdr: ChangeDetectorRef,
    private storeService: StoreService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    // Suscribirse a cambios en el estado de autenticación
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadOrders();
      } else {
        this.orders = [];
        this.filteredOrders = [];
        this.error = 'Necesitas iniciar sesión para ver tus pedidos';
        this.showLoginButton = true;
        this.cdr.markForCheck();
      }
    });
  }

  async loadOrders() {
    this.loading = true;
    this.error = null;
    this.showLoginButton = false;
    this.cdr.markForCheck();

    console.log('Iniciando carga de pedidos...');

    try {
      // Verificar si el usuario está autenticado
      const isAuth = await this.authService.isAuthenticated();
      console.log('Estado de autenticación:', isAuth);

      if (!isAuth) {
        this.loading = false;
        this.error = 'Necesitas iniciar sesión para ver tus pedidos';
        this.showLoginButton = true;
        this.cdr.markForCheck();
        return;
      }

      console.log('Obteniendo pedidos del usuario...');
      this.orders = await this.orderService.getUserOrders();
      console.log('Pedidos obtenidos:', this.orders);
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

  async refreshOrders(event?: any) {
    this.error = null;
    try {
      this.orders = await this.orderService.getUserOrders();
      this.filterOrders();
      
      // Log para ayudar a diagnosticar problemas
      console.log('Pedidos actualizados:', this.orders.map(order => ({
        id: order.id,
        store_info: order.store_info,
        storeNames: this.getStoreNames(order)
      })));
      
      // Diagnóstico específico para problema de tiendas
      this.debugStoreNames();
    } catch (error) {
      console.error('Error al actualizar pedidos:', error);
    } finally {
      if (event) {
        event.target.complete();
      }
      this.cdr.markForCheck();
    }
  }

  /**
   * Forzar una recarga completa de las órdenes limpiando cualquier caché
   */
  async forceCompleteReload() {
    const loading = await this.loadingCtrl.create({
      message: 'Recargando datos...',
      spinner: 'crescent'
    });
    
    await loading.present();
    
    try {
      console.log('Limpiando caché de tiendas...');
      this.storeService.clearCache();
      
      console.log('Recargando todas las tiendas...');
      await this.storeService.preloadStores();
      
      console.log('Recargando órdenes...');
      this.orders = await this.orderService.getUserOrders();
      this.filterOrders();
      
      this.debugStoreNames();
      
      const toast = await this.toastCtrl.create({
        message: 'Recarga completa exitosa',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      
      await toast.present();
    } catch (error) {
      console.error('Error en recarga completa:', error);
      
      const toast = await this.toastCtrl.create({
        message: 'Error al recargar. Intenta de nuevo.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      
      await toast.present();
    } finally {
      await loading.dismiss();
      this.cdr.markForCheck();
    }
  }

  /**
   * Método para diagnosticar problemas con los nombres de tiendas
   */
  private debugStoreNames() {
    if (!this.orders || this.orders.length === 0) return;
    
    console.group('Diagnóstico de nombres de tiendas');
    
    this.orders.forEach(order => {
      const storeInfo = order.store_info;
      const storeList = this.orderService.getStoreList(order);
      const displayName = this.getStoreNames(order);
      
      console.log(`Pedido ${order.id.substring(0, 8)}:`, {
        storeId: order.store_id,
        storeInfo,
        storeList: storeList.map(store => ({ 
          id: store.id, 
          name: store.name,
          isGeneric: store.name === 'Tienda'
        })),
        displayName
      });
    });
    
    console.groupEnd();
  }

  goToLogin() {
    // Guardar la URL actual para redirigir después del login
    localStorage.setItem('redirectAfterLogin', '/orders');
    // Redirigir a la página de login
    this.router.navigate(['/login']);
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
    // Si no hay store_info, mostrar valor genérico
    if (!order.store_info) return 'Tienda local';
    
    // Si hay un ID directo en store_info
    if (order.store_info.id) {
      // 'Frutas Manolo' siempre debe aparecer para el ID correcto
      if (order.store_info.id === 'cb4e8dd3-3605-4649-ab10-10f980c88f74') {
        return 'Frutas Manolo';
      }
      
      // Para otros IDs, mostrar nombres amigables según el ID
      const storeId = order.store_info.id;
      
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
    if (order.store_info.multiStore && order.store_info.stores && order.store_info.stores.length > 0) {
      // Obtener nombres para las primeras tiendas
      const storeNames = order.store_info.stores.map((store: any) => {
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

  async showIncidentsHelp() {
    const alert = await this.alertCtrl.create({
      header: 'Incidencias con Pedidos',
      cssClass: 'incidents-help-alert',
      subHeader: 'Problemas frecuentes',
      message: '',
      buttons: [
        {
          text: 'Contactar Soporte',
          handler: () => {
            this.contactSupport();
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();

    // Crear y añadir el contenido dinámicamente
    const alertElement = document.querySelector('.incidents-help-alert');
    if (alertElement) {
      // Crear contenedor principal
      const messageContent = document.createElement('div');
      messageContent.className = 'incidents-help';
      
      // Añadir elementos de incidencia
      this.addIncidentItem(messageContent, 'time-outline', 'Mi pedido está retrasado', 
        'Si tu pedido lleva más de 60 minutos en preparación, puedes contactar directamente con la tienda o con nuestro servicio de atención al cliente.');
      
      this.addIncidentItem(messageContent, 'alert-circle-outline', 'Producto en mal estado o incorrecto', 
        'Si has recibido un producto en mal estado o diferente al solicitado, contacta con nuestro servicio al cliente en las próximas 24 horas.');
      
      this.addIncidentItem(messageContent, 'bag-remove-outline', 'Falta un producto en mi pedido', 
        'Si falta algún producto en tu pedido, ponte en contacto con la tienda o servicio al cliente lo antes posible.');
      
      this.addIncidentItem(messageContent, 'cash-outline', 'Problema con el cobro', 
        'Si has detectado un error en el cobro de tu pedido, contacta con nuestro servicio de atención al cliente adjuntando el comprobante.');
      
      this.addIncidentItem(messageContent, 'close-circle-outline', 'Quiero cancelar mi pedido', 
        'Solo puedes cancelar pedidos que aún estén en estado "Pendiente". Contacta con nuestro servicio de atención al cliente para solicitar la cancelación.');
      
      // Agregar el contenido al mensaje del alerta
      const alertMessage = alertElement.querySelector('.alert-message');
      if (alertMessage) {
        alertMessage.innerHTML = '';
        alertMessage.appendChild(messageContent);
      }
      
      // Añadir estilos
      const style = document.createElement('style');
      style.textContent = `
        .incidents-help-alert .alert-wrapper {
          max-width: 90% !important;
          width: 500px !important;
          border-radius: 24px !important;
          overflow: hidden;
        }
        .incidents-help-alert .alert-head {
          padding: 12px 16px !important;
          background-color: var(--ion-color-primary);
          color: white;
        }
        .incidents-help-alert .alert-title {
          color: white !important;
          font-size: 20px !important;
          font-weight: 600 !important;
        }
        .incidents-help-alert .alert-sub-title {
          color: rgba(255, 255, 255, 0.9) !important;
          font-size: 16px !important;
          font-weight: 500 !important;
        }
        .incidents-help-alert .alert-message {
          max-height: 60vh !important;
          overflow-y: auto !important;
          padding: 16px !important;
        }
        .incidents-help {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .incident-item {
          background-color: #f8f9fa;
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .incident-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .incident-title ion-icon {
          font-size: 24px;
          color: var(--ion-color-primary);
          background-color: rgba(var(--ion-color-primary-rgb), 0.1);
          padding: 8px;
          border-radius: 50%;
        }
        .incident-title strong {
          font-size: 16px;
          font-weight: 600;
          color: var(--ion-color-dark);
        }
        .incident-item p {
          margin: 0;
          color: var(--ion-color-medium);
          font-size: 14px;
          line-height: 1.4;
          padding-left: 42px;
        }
        .incidents-help-alert .alert-button-group {
          padding: 12px !important;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .incidents-help-alert .alert-button {
          border-radius: 16px !important;
          text-transform: none !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          padding: 12px 24px !important;
          min-width: 120px !important;
          color: var(--ion-color-primary) !important;
        }
        .incidents-help-alert .alert-button.alert-button-role-cancel {
          color: var(--ion-color-medium) !important;
        }
      `;
      alertElement.appendChild(style);
    }
  }

  /**
   * Función auxiliar para crear elementos de incidencia
   */
  addIncidentItem(parent: HTMLElement, icon: string, title: string, description: string) {
    const item = document.createElement('div');
    item.className = 'incident-item';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'incident-title';
    
    const iconElement = document.createElement('ion-icon');
    iconElement.setAttribute('name', icon);
    
    const strongTitle = document.createElement('strong');
    strongTitle.textContent = title;
    
    const paragraph = document.createElement('p');
    paragraph.textContent = description;
    
    titleDiv.appendChild(iconElement);
    titleDiv.appendChild(strongTitle);
    
    item.appendChild(titleDiv);
    item.appendChild(paragraph);
    
    parent.appendChild(item);
  }

  contactSupport() {
    // Abre un modal o redirige a una página de contacto
    // Por ahora, simplemente mostramos un mensaje
    window.open('mailto:soporte@vlc-marketplace.com', '_blank');
  }

  /**
   * DIAGNÓSTICO - Ejecuta un diagnóstico completo de tiendas
   * Este método es solo para desarrollo
   */
  async runStoresDiagnostic() {
    const loading = await this.loadingCtrl.create({
      message: 'Ejecutando diagnóstico...',
      spinner: 'crescent'
    });
    
    await loading.present();
    
    try {
      // Ejecutar diagnóstico completo
      const results = await this.storeService.diagnosticAllStores();
      
      console.log('RESULTADO DE DIAGNÓSTICO DE TIENDAS:', results);
      
      const toast = await this.toastCtrl.create({
        message: 'Diagnóstico completado. Ver consola para detalles.',
        duration: 3000,
        position: 'bottom',
        color: 'success'
      });
      
      await toast.present();
      
      // Mostrar alerta con resumen
      const alert = await this.alertCtrl.create({
        header: 'Diagnóstico de Tiendas',
        message: `
          <p>Tiendas encontradas: ${results.storeCount}</p>
          <p>Pedidos con store_id: ${results.orderStoreInfo?.uniqueStoreIds?.length || 0}</p>
          <p>Items con store_id: ${results.itemStoreInfo?.uniqueStoreIds?.length || 0}</p>
        `,
        buttons: ['OK']
      });
      
      await alert.present();
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al ejecutar diagnóstico',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  handleTitleClick(event: MouseEvent) {
    // Detectar triple click para activar el diagnóstico (herramienta oculta)
    this.clickCount++;
    
    // Limpiar temporizador existente si hay uno
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
    }
    
    // Configurar nuevo temporizador para resetear contador después de 500ms
    this.clickTimer = setTimeout(async () => {
      // Si hubo 3 clicks, mostrar menú de opciones
      if (this.clickCount >= 3) {
        console.log('Activando menú de herramientas de diagnóstico...');
        
        const actionSheet = await this.alertCtrl.create({
          header: 'Herramientas de diagnóstico',
          subHeader: 'Selecciona una opción',
          buttons: [
            {
              text: 'Diagnóstico completo de tiendas',
              handler: () => {
                this.runStoresDiagnostic();
              }
            },
            {
              text: 'Forzar recarga completa',
              handler: () => {
                this.forceCompleteReload();
              }
            },
            {
              text: 'Cancelar',
              role: 'cancel'
            }
          ]
        });
        
        await actionSheet.present();
      }
      
      // Resetear contador
      this.clickCount = 0;
    }, 500);
  }
} 