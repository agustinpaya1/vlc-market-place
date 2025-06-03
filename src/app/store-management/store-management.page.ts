import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';
import { OrderService, OrderStats } from '../services/order.service';
import { QrScannerService } from '../services/qr-scanner.service';
import { Router, RouterModule } from '@angular/router';
import { Store, StoreWithStats } from '../interfaces/store.interface';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonButton, 
  IonIcon, 
  IonSpinner,
  IonBadge,
  IonToggle,
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
  alertCircle,
  scanOutline,
  locationOutline,
  arrowBack
} from 'ionicons/icons';
import { NotificationService } from '../services/notification.service';
import { CameraPermissionModalComponent } from '../components/camera-permission-modal/camera-permission-modal.component';

@Component({
  selector: 'app-store-management',
  templateUrl: './store-management.page.html',
  styleUrls: ['./store-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonToggle,
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
    CameraPermissionModalComponent
  ],
  providers: [
    AuthService,
    StoreService,
    OrderService,
    QrScannerService,
    NotificationService,
    ModalController
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
    private qrScanner: QrScannerService,
    private router: Router,
    private toastController: ToastController,
    private changeDetector: ChangeDetectorRef,
    private notificationService: NotificationService,
    private modalController: ModalController
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
      alertCircle,
      scanOutline,
      locationOutline,
      arrowBack
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
    return store.is_open || false;
  }

  hasOffers(store: Store): boolean {
    return store.hasOffers || store.has_offers || false;
  }

  getRating(store: Store): number | undefined {
    return store.rating;
  }

  getStoreStats(store: StoreWithStats) {
    return {
      totalOrders: store.stats?.totalOrders || 0,
      totalRevenue: store.stats?.totalRevenue || 0,
      pendingOrders: store.stats?.pendingOrders || 0,
      completedOrders: store.stats?.completedOrders || 0
    };
  }

  async toggleStoreStatus(store: Store) {
    try {
      const newStatus = !this.isStoreOpen(store);
      await this.storeService.updateStoreStatus(store.id, newStatus);
      
      this.notificationService.show({
        message: `Tienda ${newStatus ? 'abierta' : 'cerrada'} correctamente`,
        type: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('Error al cambiar el estado de la tienda:', error);
      this.notificationService.show({
        message: 'Error al cambiar el estado de la tienda',
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

  validateOrder(storeId: string) {
    console.log('StoreManagementPage - Navigating to order validation:', storeId);
    this.router.navigate(['/tabs/order-validation', storeId], { replaceUrl: false });
  }

  segmentChanged(event: any) {
    console.log('StoreManagementPage - Segment changed:', event.detail.value);
    this.selectedSegment = event.detail.value;
    this.changeDetector.detectChanges();
  }

  async scanQR(storeId: string) {
    try {
      const hasPermission = await this.qrScanner.hasPermission();
      if (!hasPermission) {
        this.notificationService.show({
          message: 'Se necesita permiso para usar la cámara',
          type: 'error',
          duration: 3000
        });
        return;
      }

      const scannedContent = await this.qrScanner.startScan();
      if (scannedContent) {
        // Redirigir a la página de validación con el código escaneado
        this.router.navigate(['/tabs/order-validation', storeId], {
          queryParams: { qrCode: scannedContent }
        });
      }
    } catch (error) {
      console.error('Error al escanear QR:', error);
      this.notificationService.show({
        message: 'Error al escanear el código QR',
        type: 'error',
        duration: 3000
      });
    } finally {
      await this.qrScanner.stopScan();
    }
  }
} 