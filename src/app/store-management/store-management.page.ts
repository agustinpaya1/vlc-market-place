import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { StoreService, Store } from '../services/store.service';
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
  createOutline
} from 'ionicons/icons';

interface StoreWithStats extends Store {
  totalProducts?: number;
  totalOrders?: number;
  totalRevenue?: number;
  isOpen?: boolean;
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
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      create,
      cube,
      receipt,
      cash,
      add,
      storefront,
      createOutline
    });
  }

  async ngOnInit() {
    await this.loadStores();
  }

  async loadStores() {
    this.isLoading = true;
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      const stores = await this.storeService.getUserStores(user.id);
      // Aquí podríamos cargar estadísticas adicionales para cada tienda
      this.stores = await Promise.all(stores.map(async (store) => {
        try {
          // Aquí cargaríamos las estadísticas reales de la tienda
          // Por ahora usamos datos de ejemplo
          return {
            ...store,
            totalProducts: Math.floor(Math.random() * 100),
            totalOrders: Math.floor(Math.random() * 50),
            totalRevenue: Math.floor(Math.random() * 10000),
            isOpen: Math.random() > 0.5
          };
        } catch (error) {
          console.error(`Error al cargar estadísticas para la tienda ${store.id}:`, error);
          return store;
        }
      }));
    } catch (error) {
      console.error('Error al cargar las tiendas:', error);
      const toast = await this.toastController.create({
        message: 'Error al cargar las tiendas',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  async toggleStoreStatus(store: StoreWithStats) {
    try {
      store.isOpen = !store.isOpen;
      // Aquí implementaríamos la actualización real del estado en la base de datos
      const toast = await this.toastController.create({
        message: `Tienda ${store.isOpen ? 'abierta' : 'cerrada'}`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al cambiar el estado de la tienda:', error);
      const toast = await this.toastController.create({
        message: 'Error al cambiar el estado de la tienda',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  editStore(storeId: string) {
    this.router.navigate(['/tabs/store-edit', storeId]);
  }

  viewStoreDetails(storeId: string) {
    this.router.navigate(['/tabs/store', storeId]);
  }

  viewStoreProducts(storeId: string) {
    this.router.navigate(['/tabs/store-products', storeId]);
  }

  viewStoreOrders(storeId: string) {
    this.router.navigate(['/tabs/store-orders', storeId]);
  }

  async createStore() {
    this.router.navigate(['/tabs/store-create']);
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }
} 