import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ModalController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { OrderService, Order, OrderItem, Product } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { addIcons } from 'ionicons';
import { 
  receiptOutline, 
  timeOutline, 
  checkmarkCircleOutline, 
  calendarOutline,
  storefrontOutline,
  businessOutline,
  bagOutline,
  closeOutline,
  helpCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    OrderSummaryComponent
  ]
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  error: string | null = null;
  selectedFilter: string = 'all';

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef,
    private storeService: StoreService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      'receipt-outline': receiptOutline,
      'time-outline': timeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'calendar-outline': calendarOutline,
      'storefront-outline': storefrontOutline,
      'business-outline': businessOutline,
      'bag-outline': bagOutline,
      'close-outline': closeOutline,
      'help-circle-outline': helpCircleOutline
    });
  }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    try {
      this.loading = true;
      this.error = null;

      const orders = await this.orderService.getUserOrders();
      this.orders = orders;
      this.filterOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
      this.error = 'No se pudieron cargar los pedidos';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  filterOrders() {
    switch (this.selectedFilter) {
      case 'pending':
        this.filteredOrders = this.orders.filter(order => order.status === 'pending');
        break;
      case 'delivered':
        this.filteredOrders = this.orders.filter(order => order.status === 'delivered');
        break;
      default:
        this.filteredOrders = [...this.orders];
    }
  }

  getPendingOrdersCount(): number {
    return this.orders.filter(order => order.status === 'pending').length;
  }

  getDeliveredOrdersCount(): number {
    return this.orders.filter(order => order.status === 'delivered').length;
  }

  async showOrderDetails(order: Order) {
    const modal = await this.modalCtrl.create({
      component: OrderSummaryComponent,
      componentProps: {
        orderId: order.id
      },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75
    });

    await modal.present();
  }

  async confirmOrderDelivery(orderId: string, event: Event) {
    event.stopPropagation();

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
            this.markOrderAsDelivered(orderId);
          }
        }
      ]
    });

    await alert.present();
  }

  async markOrderAsDelivered(orderId: string) {
    try {
      const success = await this.orderService.markOrderAsDelivered(orderId);
      
      if (success) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = 'delivered';
          this.filterOrders();
        }

        const toast = await this.toastCtrl.create({
          message: 'Pedido marcado como recibido',
          duration: 2000,
          color: 'success',
          position: 'bottom',
          cssClass: 'modern-toast toast-success'
        });

        await toast.present();
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      
      const toast = await this.toastCtrl.create({
        message: 'No se pudo actualizar el estado del pedido',
        duration: 2000,
        color: 'danger',
        position: 'bottom',
        cssClass: 'modern-toast toast-error'
      });

      await toast.present();
    }
  }

  async doRefresh(event: any) {
    try {
      await this.loadOrders();
    } finally {
      event.target.complete();
    }
  }

  handleTitleClick(event: Event) {
    // Implementar lógica del click en el título
  }

  getStatusColor(status: string): string {
    return status === 'delivered' ? 'success' : 'warning';
  }

  getStatusLabel(status: string): string {
    return status === 'delivered' ? 'Entregado' : 'Pendiente';
  }

  getStoreNames(order: Order): string {
    if (order.store_info?.multiStore && Array.isArray(order.store_info.stores)) {
      return order.store_info.stores.map((store: any) => store.name).join(', ');
    }
    return order.store_info?.name || 'Tienda local';
  }

  getItemCount(order: Order): number {
    return order.items?.length || 0;
  }

  getProductImage(item: OrderItem): string {
    return item.product_info?.image_url || 'assets/placeholder.png';
  }

  getProductName(item: OrderItem): string {
    return item.product_info?.name || 'Producto';
  }

  showOrderSummary(orderId: string) {
    // Implementar lógica para mostrar el resumen del pedido
  }

  resetFilter() {
    this.selectedFilter = 'all';
    this.filterOrders();
  }

  async showGeneralHelp() {
    const alert = await this.alertCtrl.create({
      header: 'Preguntas Frecuentes',
      cssClass: 'help-alert',
      buttons: [{
        text: 'Entendido',
        role: 'confirm',
        cssClass: 'primary'
      }]
    });

    // Crear el contenido HTML manualmente
    const content = document.createElement('div');
    content.className = 'help-content';
    content.innerHTML = `
      <div class="help-item">
        <ion-icon name="time-outline" color="warning"></ion-icon>
        <div class="help-text">
          <strong>¿Cuánto tardan en llegar los pedidos?</strong>
          <p>Los pedidos suelen entregarse en 24-48 horas hábiles desde su confirmación.</p>
        </div>
      </div>

      <div class="help-item">
        <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
        <div class="help-text">
          <strong>¿Cómo confirmo que recibí mi pedido?</strong>
          <p>Usa el botón "Marcar como recibido" en los pedidos pendientes.</p>
        </div>
      </div>

      <div class="help-item">
        <ion-icon name="receipt-outline" color="primary"></ion-icon>
        <div class="help-text">
          <strong>¿Dónde veo el detalle de mi pedido?</strong>
          <p>Toca cualquier pedido para ver todos sus detalles.</p>
        </div>
      </div>

      <div class="help-item">
        <ion-icon name="close-circle-outline" color="danger"></ion-icon>
        <div class="help-text">
          <strong>¿Puedo cancelar un pedido?</strong>
          <p>Solo puedes cancelar pedidos que estén en estado "Pendiente".</p>
        </div>
      </div>

      <div class="help-item">
        <ion-icon name="alert-circle-outline" color="warning"></ion-icon>
        <div class="help-text">
          <strong>¿Qué hago si hay una incidencia?</strong>
          <p>Contacta directamente con la tienda o con nuestro servicio de atención al cliente.</p>
        </div>
      </div>
    `;

    await alert.present();

    // Después de que se muestre el alert, insertamos el contenido
    const alertMessage = document.querySelector('.help-alert .alert-message');
    if (alertMessage) {
      alertMessage.innerHTML = '';
      alertMessage.appendChild(content);
    }
  }
}