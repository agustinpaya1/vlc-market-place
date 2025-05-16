import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonButtons,
  IonCardSubtitle,
  IonSpinner,
  ModalController,
  IonThumbnail,
  IonBadge
} from '@ionic/angular/standalone';
import { CartService, CartItem } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { addIcons } from 'ionicons';
import { trash, arrowBack, add, remove, checkmarkCircle, home, cartOutline, storefront, locationOutline, time, star, eye, locationSharp, homeOutline, timeOutline, chevronForward, alertCircleOutline } from 'ionicons/icons';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';
import { SupabaseService } from '../services/supabase.service';
import { Subscription } from 'rxjs';

interface Store {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  category?: string;
  open_time?: string;
  openTime?: string;
  rating?: number;
  isOpen?: boolean;
  contact_phone?: string;
  phone?: string;
  distance?: number;
}

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonButtons,
    IonCardSubtitle,
    IonSpinner,
    IonThumbnail,
    IonBadge
  ]
})
export class CarritoComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  totalItems = 0;
  totalPrice = 0;
  paymentSuccess = false;
  paymentId = '';
  
  // Variables para la lista de tiendas
  stores: Store[] = [];
  isLoading = true;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router,
    private modalCtrl: ModalController,
    private supabaseService: SupabaseService
  ) {
    addIcons({
      arrowBack, 
      checkmarkCircle, 
      storefront, 
      remove, 
      add, 
      trash, 
      home, 
      cartOutline, 
      locationOutline,
      locationSharp,
      time,
      star,
      eye,
      homeOutline,
      timeOutline,
      chevronForward,
      alertCircleOutline
    });
  }

  ngOnInit() {
    // Suscribirse a los cambios en el carrito
    const cartSubscription = this.cartService.getCartItems().subscribe((items: CartItem[]) => {
      this.cartItems = items;
      this.calculateTotal();
      
      // Cargar tiendas si el carrito está vacío
      if (this.cartItems.length === 0 && !this.paymentSuccess) {
        console.log('Carrito vacío, cargando tiendas disponibles...');
        this.loadStores();
      }
    });
    
    // Guardar la suscripción para limpiarla después
    this.subscriptions.push(cartSubscription);
  }
  
  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async loadStores() {
    try {
      this.isLoading = true;
      console.log('Cargando tiendas desde Supabase...');
      
      // Obtener tiendas y categorías en paralelo, igual que en la pantalla de inicio
      const [storesData, categoriesByStore] = await Promise.all([
        this.supabaseService.getStores(),
        this.supabaseService.getAllStoreCategories()
      ]);

      // DEBUG: Log de categorías y tiendas
      console.log('categoriesByStore:', categoriesByStore);
      console.log('IDs de tiendas:', storesData.map(s => s.id));

      if (storesData && storesData.length > 0) {
        this.stores = storesData.map(store => {
          return {
            id: store.id,
            name: store.name,
            description: store.description || '',
            imageUrl: store.imageUrl || 'assets/stores/default-store.jpg',
            address: store.location || 'Valencia',
            open_time: store.open_time || '9:00 - 20:00',
            rating: store.rating || 4.5,
            category: store.categories?.[0] || (categoriesByStore[String(store.id)]?.[0] || 'Tienda local'),
            isOpen: this.checkIfStoreIsOpen(store.open_time),
            distance: store.distance || this.calculateRandomDistance()
          };
        });
      } else {
        console.log('No se encontraron tiendas en Supabase, usando datos de ejemplo');
        this.useExampleStores();
      }
      
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      // Usar datos de ejemplo si hay error
      this.useExampleStores();
    } finally {
      this.isLoading = false;
    }
  }
  
  // Método para usar tiendas de ejemplo cuando no hay datos de Supabase
  private useExampleStores() {
    const tiendas = [
      {
        id: '1',
        name: 'Mercado Central',
        description: 'Mercado tradicional de Valencia',
        image_url: 'assets/stores/mercado-central.jpg',
        latitude: 39.4736,
        longitude: -0.3783,
        address: 'Plaza del Mercado, Valencia',
        category: 'Mercado',
        open_time: '8:00 - 20:00',
        rating: 4.8,
        contact_phone: '123456789'
      },
      {
        id: '2',
        name: 'Tienda Orgánica',
        description: 'Productos ecológicos',
        image_url: 'assets/stores/tienda-organica.jpg',
        latitude: 39.4650,
        longitude: -0.3700,
        address: 'Calle Colón, Valencia',
        category: 'Alimentación',
        open_time: '9:00 - 21:00',
        rating: 4.5,
        contact_phone: '987654321'
      },
      {
        id: '3',
        name: 'Panadería Artesanal',
        description: 'Pan y dulces tradicionales',
        image_url: 'assets/stores/panaderia.jpg',
        latitude: 39.4700,
        longitude: -0.3750,
        address: 'Calle Ruzafa, Valencia',
        category: 'Panadería',
        open_time: '7:00 - 20:00',
        rating: 4.7,
        contact_phone: '555666777'
      },
      {
        id: '4',
        name: 'Frutería Valencia',
        description: 'Frutas y verduras frescas',
        image_url: 'assets/stores/fruteria.jpg',
        latitude: 39.4680,
        longitude: -0.3720,
        address: 'Avenida del Puerto, Valencia',
        category: 'Frutería',
        open_time: '8:00 - 20:00',
        rating: 4.6,
        contact_phone: '444555666'
      },
      {
        id: '5',
        name: 'Carnicería Gourmet',
        description: 'Carnes de calidad superior',
        image_url: 'assets/stores/carniceria.jpg',
        latitude: 39.4720,
        longitude: -0.3760,
        address: 'Calle Gran Vía, Valencia',
        category: 'Carnicería',
        open_time: '9:00 - 19:00',
        rating: 4.9,
        contact_phone: '333222111'
      }
    ];
    
    // Procesar los datos de ejemplo
    this.stores = tiendas.map(store => {
      const isOpenNow = this.checkIfStoreIsOpen(store.open_time);
      return {
        ...store,
        imageUrl: store.image_url,
        isOpen: isOpenNow,
        phone: store.contact_phone,
        distance: this.calculateRandomDistance()
      };
    });
  }
  
  private calculateRandomDistance(): number {
    return parseFloat((Math.random() * 4.9 + 0.1).toFixed(1));
  }
  
  private checkIfStoreIsOpen(openTime?: string): boolean {
    if (!openTime) return false;
    const now = new Date();
    const hour = now.getHours();
    const times = openTime.split(' - ');
    if (times.length !== 2) return false;
    
    const openHour = parseInt(times[0].split(':')[0], 10);
    const closeHour = parseInt(times[1].split(':')[0], 10);
    
    return hour >= openHour && hour < closeHour;
  }
  
  navigateToStore(store: Store) {
    // Establecer la sesión activa para evitar que se muestre la intro
    sessionStorage.setItem('activeSession', 'true');
    
    console.log(`Navegando a la tienda: ${store.name} (ID: ${store.id})`);
    
    // Navegar a la página de tienda específica
    this.router.navigate(['/tabs/store', store.id]);
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.id, newQuantity);
    } else {
      this.cartService.removeFromCart(item.id);
    }
  }

  removeItem(productId: string) {
    // Comprobar si es el último elemento
    const isLastItem = this.cartItems.length === 1;
    
    // Eliminar el elemento del carrito
    this.cartService.removeFromCart(productId);
    
    // Si era el último elemento, asegurarse de que se cargan las tiendas
    if (isLastItem) {
      console.log('Se eliminó el último elemento del carrito');
    }
  }

  clearCart() {
    this.cartService.clearCart();
    // No es necesario cargar las tiendas aquí, ya que la suscripción a cartItems lo hará automáticamente
    console.log('Carrito vaciado manualmente');
  }

  goBack(): void {
    // Establecer la sesión activa para evitar que se muestre la intro
    sessionStorage.setItem('activeSession', 'true');
    this.router.navigate(['/tabs/stores'], { replaceUrl: true });
  }

  async proceedToCheckout(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PaymentModalComponent,
      componentProps: {
        cartItems: this.cartItems,
        totalAmount: this.totalPrice
      },
      cssClass: 'payment-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'success' && data?.success) {
      this.paymentSuccess = true;
      this.paymentId = data.paymentId;
      
      // Clear the cart after successful payment
      this.cartService.clearCart();
      
      // Use a timer to show success message for 3 seconds before redirecting
      console.log('Payment successful, will redirect to stores in 3 seconds');
      
      setTimeout(() => {
        console.log('Redirecting to stores now...');
        // Use the correct path according to your router configuration
        this.router.navigateByUrl('/tabs/stores').then(() => {
          console.log('Navigation complete');
        }).catch(err => {
          console.error('Navigation error:', err);
        });
      }, 3000); // Increased to 3 seconds for better user experience
    }
  }

  calculateTotal() {
    this.totalItems = this.cartService.getTotalItems();
    this.totalPrice = this.cartService.getTotalPrice();
  }
  
  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/logo-placeholder.png';
    }
  }
} 