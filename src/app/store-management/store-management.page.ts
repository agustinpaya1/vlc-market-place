import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { StoreService, Store } from '../services/store.service';
import { OrderService, OrderStats } from '../services/order.service';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonThumbnail, 
  IonButton, 
  IonIcon, 
  IonSpinner,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonBadge,
  IonToggle,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonButtons,
  IonBackButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  create, 
  cube, 
  receipt, 
  cash, 
  add, 
  storefront,
  createOutline,
  time,
  star,
  alertCircle
} from 'ionicons/icons';
import { NotificationService } from '../services/notification.service';

interface StoreWithStats extends Store {
  stats?: OrderStats;
}

@Component({
  selector: 'app-store-management',
  templateUrl: './store-management.page.html',
  styleUrls: ['./store-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonButton,
    IonIcon,
    IonSpinner,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonBadge,
    IonToggle,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonButtons,
    IonBackButton
  ]
})
export class StoreManagementPage implements OnInit {
  stores: StoreWithStats[] = [];
  isLoading = true;
  selectedSegment = 'active';

  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private orderService: OrderService,
    private router: Router,
    private toastController: ToastController,
    private changeDetector: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    addIcons({
      create,
      cube,
      receipt,
      cash,
      add,
      storefront,
      createOutline,
      time,
      star,
      alertCircle
    });
  }

  async ngOnInit() {
    console.log('StoreManagementPage - Initializing');
    await this.loadStores();
  }

  async loadStores() {
    console.log('StoreManagementPage - Loading stores');
    this.isLoading = true;
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        console.log('StoreManagementPage - No user found, redirecting to login');
        this.router.navigate(['/login']);
        return;
      }

      console.log('StoreManagementPage - Loading stores for user:', user.id);
      const stores = await this.storeService.getUserStores(user.id);
      console.log('StoreManagementPage - Loaded stores:', stores);

      // Obtener estadísticas de todas las tiendas de una vez
      const storeIds = stores.map(store => store.id);
      const statsMap = await this.orderService.getMultipleStoresStats(storeIds);

      // Combinar tiendas con sus estadísticas
      this.stores = stores.map(store => ({
        ...store,
        stats: statsMap[store.id]
      }));

      console.log('StoreManagementPage - Processed stores with stats:', this.stores);
      this.changeDetector.detectChanges();
    } catch (error: any) {
      console.error('StoreManagementPage - Error loading stores:', error);
      this.notificationService.show({
        message: 'Error al cargar las tiendas: ' + (error.message || 'Error desconocido'),
        type: 'error',
        duration: 3000
      });
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  isStoreOpen(store: Store): boolean {
    return store.open_time !== null;
  }

  async toggleStoreStatus(store: Store) {
    try {
      const newOpenTime = this.isStoreOpen(store) ? null : new Date().toISOString();
      await this.storeService.updateStore({
        id: store.id,
        open_time: newOpenTime
      });
      
      store.open_time = newOpenTime;
      this.notificationService.show({
        message: `Tienda ${this.isStoreOpen(store) ? 'abierta' : 'cerrada'} correctamente`,
        type: 'success',
        duration: 2000
      });
      this.changeDetector.detectChanges();
    } catch (error: any) {
      console.error('Error al cambiar el estado de la tienda:', error);
      this.notificationService.show({
        message: 'Error al cambiar el estado de la tienda: ' + (error.message || 'Error desconocido'),
        type: 'error',
        duration: 3000
      });
    }
  }

  editStore(storeId: string) {
    console.log('StoreManagementPage - Navigating to edit store:', storeId);
    this.router.navigate(['/tabs/store-edit', storeId], { replaceUrl: false });
  }

  viewStoreProducts(storeId: string) {
    console.log('StoreManagementPage - Navigating to store products:', storeId);
    this.router.navigate(['/tabs/store-products', storeId], { replaceUrl: false });
  }

  viewStoreOrders(storeId: string) {
    console.log('StoreManagementPage - Navigating to store orders:', storeId);
    this.router.navigate(['/tabs/store-orders', storeId], { replaceUrl: false });
  }

  async createStore() {
    console.log('StoreManagementPage - Navigating to create store');
    this.router.navigate(['/tabs/store-create'], { replaceUrl: false });
  }

  segmentChanged(event: any) {
    console.log('StoreManagementPage - Segment changed:', event.detail.value);
    this.selectedSegment = event.detail.value;
    this.changeDetector.detectChanges();
  }
} 