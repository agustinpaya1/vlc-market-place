import { Component, OnInit, ViewChild, NgZone, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { 
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent, 
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPopover,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  ModalController,
  LoadingController,
  AlertController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  heartOutline, 
  heart, 
  storefront, 
  location, 
  time, 
  arrowForward, 
  star, 
  trendingUp, 
  map, 
  starHalf, 
  sunny, 
  moon, 
  notifications, 
  searchOutline, 
  search, 
  locationOutline, 
  chevronDownOutline, 
  notificationsOutline, 
  optionsOutline, 
  timeOutline, 
  arrowForwardOutline, 
  camera, 
  chatbubbleEllipses, 
  shirtOutline, 
  pizzaOutline, 
  fishOutline, 
  basketOutline, 
  wineOutline, 
  leafOutline, 
  restaurantOutline, 
  fastFoodOutline, 
  waterOutline, 
  scanOutline, 
  walletOutline, 
  cash, 
  trash, 
  trophy, 
  gift, 
  ribbon, 
  pricetag, 
  cube, 
  calendar, 
  logInOutline, 
  constructOutline,
  documentOutline,
  gameControllerOutline,
  flowerOutline,
  musicalNotesOutline,
  beerOutline
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { FavoritesService } from '../services/favorites.service';
import { debounceTime, distinctUntilChanged, takeUntil, take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { createWorker } from 'tesseract.js';
import { VlcoinModalComponent } from '../vlcoin-modal/vlcoin-modal.component';
import { VlcoinService } from '../services/vlcoin.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  category: string;
  isOffer?: boolean;
  offerPrice?: number;
  stock: number;
  store_id?: string;
}

interface Store {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  location?: string;
  openTime?: string;
  open_time?: string;
  rating?: number;
  categories?: string[];
  category?: string;
  hasOffers?: boolean;
  has_offers?: boolean;
  distance?: number;
  products?: Product[];
  owner_id?: string;
}

@Component({
  selector: 'app-stores',
  templateUrl: './stores.page.html',
  styleUrls: ['./stores.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonButton,
    IonIcon,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonSpinner,
    IonFabButton,
    IonPopover,
    IonSegment,
    IonSegmentButton
  ],
  styles: [
    `
    .subtle-toast {
      --background: rgba(40, 167, 69, 0.95); /* verde sutil */
      --color: #fff;
      --border-radius: 12px;
      --box-shadow: 0 2px 8px rgba(0,0,0,0.10);
      font-size: 0.98em;
      min-width: 120px;
      max-width: 80vw;
      text-align: center;
      margin-top: 8px;
    }
    `
  ]
})
export class StoresPage implements OnInit, OnDestroy {
  @ViewChild('filterPopover') filterPopover!: IonPopover;
  @ViewChild('notificationPopover') notificationPopover!: IonPopover;
  
  // Add property for controlling the popover visibility
  isFilterPopoverOpen = false;
  notificationPopoverOpen = false;
  notificationPopoverEvent: any = null;
  
  // Usuario ubicación
  userLocation: string = 'Valencia, España';
  
  selectedCategory: string = 'Todos';
  selectedSort: string = 'default';
  isLoading = false;
  searchTerm: string = '';
  showSearchBar: boolean = false;
  notificationCount: number = 0; // Contador de notificaciones
  vlcoinBalance: number = 2450; // Balance de VLCoins
  allStores: Store[] = []; // Original unfiltered stores
  categories: string[] = [
    'Todos',
    'Fruterías',
    'Carnicerías',
    'Pescaderías',
    'Panaderías',
    'Lácteos',
    'Orgánicos',
    'Vinos',
    'Gourmet',
    'Herramientas',
    'Especialidad',
    'Papelería',
    'Juguetería',
    'Perfumería',
    'Licores'
  ];
  sortOptions = [
    { value: 'default', label: 'Destacados', icon: 'star' },
    { value: 'distance', label: 'Más cercanos', icon: 'location' },
    { value: 'rating', label: 'Mejor valorados', icon: 'star-half' },
    { value: 'offers', label: 'Ofertas', icon: 'trending-up' }
  ];
  stores: Store[] = [];
  private searchTerms = new Subject<string>();

  // Converted from getter to property
  filteredStores: Store[] = [];

  notifications: any[] = [];

  // Add property for authentication state
  isAuthenticated: boolean = false;
  private destroy$ = new Subject<void>();

  userFavorites: string[] = [];
  favoriteStores: any[] = []; // Array para almacenar tiendas favoritas completas

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private zone: NgZone,
    private changeDetector: ChangeDetectorRef,
    private toastController: ToastController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private authService: AuthService,
    private vlcoinService: VlcoinService,
    private favoritesService: FavoritesService // Inyectar servicio de favoritos
  ) {
    // Registrar iconos importantes para la aplicación
    addIcons({
      heartOutline, heart, storefront, location, time, arrowForward, star, trendingUp, map, starHalf,
      sunny, moon, notifications, searchOutline, search, locationOutline,
      chevronDownOutline, notificationsOutline, optionsOutline, timeOutline,
      arrowForwardOutline, camera, chatbubbleEllipses, shirtOutline, pizzaOutline,
      fishOutline, basketOutline, wineOutline, leafOutline, restaurantOutline,
      fastFoodOutline, waterOutline, scanOutline, walletOutline, cash, trash,
      trophy, gift, ribbon, pricetag, cube, calendar, logInOutline, constructOutline,
      documentOutline, gameControllerOutline, flowerOutline, musicalNotesOutline,
      beerOutline
    });

    // Set up search functionality with improved debounce
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      console.log('Procesando término de búsqueda:', term);
      this.searchTerm = term;
      // Apply filters when search term changes
      this.applyFilters();
    });

    // Set up authentication listener
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAuthenticated = !!user;
      // Only simulate notifications if user is authenticated
      if (this.isAuthenticated) {
        this.simulateNotifications();
      } else {
        // Clear notifications if not authenticated
        this.notifications = [];
        this.notificationCount = 0;
      }
    });

    // Suscribirse a los cambios en favoritos
    this.favoritesService.getFavorites().pipe(takeUntil(this.destroy$)).subscribe(favorites => {
      this.favoriteStores = favorites;
      // Si hay datos cargados, actualizar la vista
      if (!this.isLoading && this.filteredStores.length > 0) {
        this.forceUpdate();
      }
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    
    // Cargar notificaciones de prueba
    this.simulateNotifications();
    
    // Get VLCoin balance from VLCoin service
    this.vlcoinService.vlcoinBalance$.subscribe(balance => {
      this.vlcoinBalance = balance;
    });
    
    // Initialize VLCoin data for the current user
    this.authService.user$.subscribe(async user => {
      if (user && user.id) {
        await this.vlcoinService.getVlcoinBalance(user.id);
      }
    });
    
    // Cargar favoritos del usuario si está autenticado
    this.authService.user$.subscribe(async user => {
      if (user && user.id) {
        try {
          const favStores = await this.supabaseService.getFavorites(user.id, 'store');
          this.userFavorites = favStores.map((f: any) => f.store_id);
        } catch (e) {
          this.userFavorites = [];
        }
      } else {
        this.userFavorites = [];
      }
    });
    
    try {
      // Aplicar filtros inmediatamente para evitar recálculos innecesarios
      this.applyFilters();
      setTimeout(async () => {
        try {
          // Obtener tiendas y categorías en paralelo
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
                imageUrl: store.image_url || 'assets/stores/default-store.jpg',
                location: store.location || 'Valencia',
                openTime: store.open_time || '9:00 - 20:00',
                rating: store.rating || 4.5,
                categories: categoriesByStore[String(store.id)] || [],
                hasOffers: store.has_offers || false,
                distance: store.distance || 1.0
              };
            });
          } else {
            this.loadMockStores();
          }

          this.allStores = [...this.stores];
          this.applyFilters();
          this.simulateNotifications();
        } catch (error) {
          console.error('Error al cargar tiendas:', error);
          this.loadMockStores();
          this.allStores = [...this.stores];
          this.applyFilters();
        } finally {
          this.isLoading = false;
        }
      }, 100);
    } catch (error) {
      console.error('Error inicial:', error);
      this.loadMockStores();
      this.allStores = [...this.stores];
      this.applyFilters();
      this.isLoading = false;
    }
  }

  ionViewWillLeave() {
    // Resetear el estado del popover de notificaciones al salir de la página
    this.notificationPopoverOpen = false;
    this.notificationPopoverEvent = null;
  }

  /**
   * Applies all current filters (search, category, sort) to the allStores array
   * and updates the filteredStores property
   */
  applyFilters() {
    // Always start with the complete list of stores from allStores
    let result = [...this.allStores];

    // Aplicar filtro por términos de búsqueda
    if (this.searchTerm && this.searchTerm.trim().length >= 2) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result
        .map(store => {
          let score = 0;
          const name = store.name.toLowerCase();
          const desc = store.description?.toLowerCase() || '';
          const categories = store.categories?.map(cat => cat.toLowerCase()) || [];
          const location = store.location?.toLowerCase() || '';

          // Fuzzy matching: calcular distancia de Levenshtein
          const levName = levenshtein(name, term);
          const levDesc = desc ? levenshtein(desc, term) : 99;
          const levCategory = categories.length > 0 ? Math.min(...categories.map(cat => levenshtein(cat, term))) : 99;
          const levLocation = location ? levenshtein(location, term) : 99;

          // Score: cuanto menor la distancia, mayor el score
          if (levName <= 2) score += 10 - levName * 2; // nombre muy parecido
          else if (name.includes(term)) score += 5;

          if (levDesc <= 2) score += 4 - levDesc;
          else if (desc.includes(term)) score += 2;

          if (levCategory <= 2) score += 4 - levCategory;
          else if (categories.some(cat => cat.includes(term))) score += 2;

          if (levLocation <= 2) score += 2 - levLocation;
          else if (location.includes(term)) score += 1;

          // Si hay algún match, marcarlo
          return {
            store,
            score,
            hasMatch: score > 0
          };
        })
        .filter(item => item.hasMatch)
        .sort((a, b) => b.score - a.score)
        .map(item => item.store);
    }

    // Aplicar filtro por categoría
    if (this.selectedCategory !== 'Todos') {
      result = result.filter(store => 
        store.categories && store.categories.includes(this.selectedCategory)
      );
    }

    // Aplicar filtros según la opción seleccionada
    switch (this.selectedSort) {
      case 'distance':
        // Mostrar tiendas ordenadas por distancia (más cercanas primero)
        result.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        break;
      case 'rating':
        // Mostrar tiendas ordenadas por valoración (mejor valoradas primero)
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'offers':
        // Mostrar SOLO tiendas con ofertas
        result = result.filter(store => store.hasOffers || store.has_offers);
        break;
      // default - mantener el listado sin filtro adicional
    }

    console.log('Tiendas filtradas que se mostrarán:', result);
    console.log('Número de tiendas a mostrar:', result.length);
    
    // Update the filteredStores property with the result
    this.filteredStores = result;
  }

  /**
   * Selecciona una categoría y filtra las tiendas
   */
  selectCategory(category: string) {
    // Si ya está seleccionada, no hacemos nada para evitar re-renders innecesarios
    if (this.selectedCategory === category) {
      return;
    }
    
    // Debug actual state before change
    this.debugFilterState('Before category change');
    
    // Cambiamos la categoría seleccionada
    this.selectedCategory = category;
    
    // Apply filters with the new category
    this.applyFilters();
    
    // Mostramos feedback para el usuario
    if (category !== 'Todos') {
      console.log(`Filtrando tiendas por categoría: ${category}`);
    } else {
      console.log('Mostrando todas las tiendas');
    }
    
    // Añadimos una pequeña animación al elemento seleccionado
    setTimeout(() => {
      const selectedElement = document.querySelector('.category-item.active .category-icon');
      if (selectedElement) {
        selectedElement.classList.add('pulse');
        setTimeout(() => {
          selectedElement.classList.remove('pulse');
        }, 300);
      }
    }, 50);
    
    // Debug new state after change
    this.debugFilterState('After category change');
    
    // Force change detection and UI update
    this.forceUpdate();
  }

  selectSort(sort: string) {
    this.selectedSort = sort;
  }

  handleImageError(event: Event): void {
    // Proporcionar una imagen de respaldo cuando falla la carga de la imagen
    const img = event.target as HTMLImageElement;
    if (img) {
      // Usar una imagen por defecto
      img.src = 'assets/stores/default-store.jpg';
      // Prevenir bucle infinito si la imagen de respaldo también falla
      img.onerror = null;
    }
  }

  // Método para manejar errores de carga de imágenes en notificaciones
  handleNotificationImageError(event: Event, notificationType: string): void {
    // Ocultar la imagen que falló y dejar que se muestre el icono por defecto
    const img = event.target as HTMLImageElement;
    if (img && img.parentElement) {
      // Ocultar la imagen
      img.style.display = 'none';
      
      // Crear y mostrar un icono de respaldo
      const fallbackIcon = document.createElement('div');
      fallbackIcon.className = `notification-fallback-icon notification-fallback-${notificationType}`;
      
      const icon = document.createElement('ion-icon');
      
      // Asignar icono según el tipo de notificación
      switch (notificationType) {
        case 'reto':
          icon.setAttribute('name', 'trophy');
          icon.setAttribute('color', 'warning');
          break;
        case 'recompensa':
          icon.setAttribute('name', 'gift');
          icon.setAttribute('color', 'tertiary');
          break;
        case 'oferta':
          icon.setAttribute('name', 'pricetag');
          icon.setAttribute('color', 'success');
          break;
        case 'recordatorio':
          icon.setAttribute('name', 'calendar');
          icon.setAttribute('color', 'primary');
          break;
        default:
          icon.setAttribute('name', 'notifications');
          icon.setAttribute('color', 'medium');
      }
      
      fallbackIcon.appendChild(icon);
      img.parentElement.appendChild(fallbackIcon);
    }
  }

  async viewStore(storeId: string) {
    console.log('Navegando a la tienda con ID:', storeId);
    // Asegurarse de que el popover de notificaciones esté cerrado
    this.notificationPopoverOpen = false;
    this.notificationPopoverEvent = null;
    this.router.navigate(['/tabs/store', storeId]);
  }

  toggleSearch() {
    this.showSearchBar = !this.showSearchBar;
    if (!this.showSearchBar) {
      this.searchTerm = '';
      this.stores = [...this.allStores]; // Restore original stores when search is closed
    }
  }

  onSearchInput(event: any) {
    const term = event.detail.value.trim();
    
    // Si está vacío, restaurar todas las tiendas inmediatamente
    if (!term) {
      this.stores = [...this.allStores];
      return;
    }
    
    // Ejecutar búsqueda después de escribir al menos 2 caracteres
    if (term.length >= 2) {
      this.searchTerms.next(term);
    }
  }

  searchStores() {
    console.log('Ejecutando búsqueda con término:', this.searchTerm);
    
    if (!this.searchTerm || !this.searchTerm.trim()) {
      // Reset search term and reapply filters
      this.searchTerm = '';
    }
    
    // Apply filters with current search term
    this.applyFilters();
    
    console.log(`Buscando tiendas con término: "${this.searchTerm}"`);
  }

  // Simular llegada de notificaciones
  private async simulateNotifications() {
    // If user is not authenticated, don't generate notifications
    if (!this.isAuthenticated) {
      return;
    }
    
    // Helper para buscar id de tienda por nombre
    const getStoreIdByName = (name: string) => {
      const store = this.allStores.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
      return store ? store.id : undefined;
    };
    
    // Limpiar notificaciones previas
    this.notifications = [];

    // Obtener descuentos reales de las tiendas
    for (const store of this.allStores) {
      try {
        const products = await this.supabaseService.getStoreProducts(store.id);
        // Buscar el mayor descuento aplicado en los productos de la tienda
        let maxDiscount = 0;
        let productWithDiscount = null;
        for (const product of products) {
          if (product.isOffer && product.offerPrice && product.price) {
            const discount = Math.round(100 - (product.offerPrice / product.price) * 100);
            if (discount > maxDiscount) {
              maxDiscount = discount;
              productWithDiscount = product;
            }
          }
        }
        if (maxDiscount > 0 && productWithDiscount) {
          this.notifications.push({
            id: `${store.id}-oferta`,
            type: 'oferta',
            title: `¡${maxDiscount}% de descuento en ${store.name}!`,
            message: `Aprovecha la oferta en ${productWithDiscount.name}: antes ${productWithDiscount.price}€, ahora ${productWithDiscount.offerPrice}€`,
            storeId: store.id
          });
        }
      } catch (e) {
        // Si falla, no mostrar notificación de oferta para esa tienda
      }
    }

    // Notificación de recordatorio genérica
    this.notifications.push({
      id: 'recordatorio',
      type: 'recordatorio',
      title: 'Recordatorio',
      message: 'No olvides visitar el mercado hoy'
    });

    // Añadir retos activos del modal VL Coins
    const challenges = [
      {
        id: 1,
        title: 'Reto del Mercado Central',
        description: 'Visita 3 puestos diferentes en el Mercado Central y realiza una compra mínima de 5€ en cada uno.',
        image: 'assets/images/market-challenge.jpg',
        progress: { current: 0, total: 3 },
        daysLeft: 5,
        coins: 300
      },
      {
        id: 2,
        title: 'Reseñador Experto',
        description: 'Escribe 5 reseñas detalladas con fotos en comercios locales que hayas visitado este mes.',
        image: 'assets/images/review-challenge.jpg',
        progress: { current: 0, total: 5 },
        daysLeft: 12,
        coins: 250
      },
      {
        id: 3,
        title: 'Explorador de Barrios',
        description: 'Visita y compra en 4 tiendas diferentes en el barrio de Ruzafa durante este mes.',
        image: 'assets/images/neighborhood-challenge.jpg',
        progress: { current: 0, total: 4 },
        daysLeft: 20,
        coins: 400
      }
    ];

    // Añadir recompensas disponibles del modal VL Coins
    const rewards = [
      {
        id: 1,
        title: '5€ Frutas/Verduras',
        location: 'Mercado Central',
        image: 'assets/images/fruits-reward.jpg',
        coins: 200,
        category: 'Mercado Central'
      },
      {
        id: 2,
        title: 'Degustación Jamón',
        location: 'Mercado Ruzafa',
        image: 'assets/images/ham-reward.jpg',
        coins: 350,
        category: 'Mercado Ruzafa'
      },
      {
        id: 3,
        title: 'Pack Snacks Asiáticos',
        location: 'Asia Market',
        image: 'assets/images/snacks-reward.jpg',
        coins: 150,
        category: 'Tiendas Chinas'
      }
    ];
    
    // Añadir retos activos a las notificaciones
    for (const challenge of challenges) {
      this.notifications.push({
        id: `challenge-${challenge.id}`,
        type: 'reto',
        title: `¡Nuevo reto: ${challenge.title}!`,
        message: `${challenge.description} Gana ${challenge.coins} VLCoins en ${challenge.daysLeft} días.`,
        image: challenge.image,
        challenge: challenge
      });
    }

    // Añadir recompensas disponibles a las notificaciones
    for (const reward of rewards) {
      this.notifications.push({
        id: `reward-${reward.id}`,
        type: 'recompensa',
        title: `Recompensa disponible: ${reward.title}`,
        message: `Canjea por ${reward.coins} VLCoins en ${reward.location}.`,
        image: reward.image,
        reward: reward
      });
    }

    this.notificationCount = this.notifications.length;
  }

  // Mostrar y manejar notificaciones
  async showNotifications() {
    console.log('Mostrando notificaciones');
    
    if (this.notificationCount > 0) {
      // Create a temporary variable to store the count before resetting
      const count = this.notificationCount;
      
      // Create a more descriptive message based on the number of notifications
      let message = '';
      if (count === 1) {
        message = 'Tienes 1 notificación nueva';
      } else {
        message = `Tienes ${count} notificaciones nuevas`;
      }
      
      const toast = await this.toastController.create({
        message: message,
        duration: 2500,
        position: 'top',
        color: 'success',
        cssClass: 'notification-toast',
        buttons: [
          {
            text: 'Ver todas',
            role: 'info',
            handler: () => {
              // Aquí puedes navegar a una página de notificaciones o mostrar un modal
              console.log('Ver todas las notificaciones');
              this.showNotificationsList();
            }
          }
        ]
      });
      
      await toast.present();
      
      // Add visual feedback with a small animation
      const notificationIcon = document.querySelector('ion-button ion-icon[name="notifications-outline"]');
      if (notificationIcon) {
        notificationIcon.classList.add('notification-pulse');
        setTimeout(() => {
          notificationIcon.classList.remove('notification-pulse');
        }, 1000);
      }
      
      // Reseteamos el contador de notificaciones
      this.notificationCount = 0;
    } else {
      const toast = await this.toastController.create({
        message: 'No tienes notificaciones nuevas',
        duration: 2000,
        position: 'top',
        color: 'medium'
      });
      
      await toast.present();
    }
  }
  
  // Mostrar lista de notificaciones (ejemplo)
  private showNotificationsList() {
    // Esta es una función de ejemplo que podría mostrar un modal
    // o navegar a una página de notificaciones
    this.showToast('Abriendo lista de notificaciones...');
    
    // Simulación de notificaciones
    const mockNotifications = [
      { title: 'Oferta especial', message: '20% de descuento en tu tienda favorita' },
      { title: 'Nuevo producto', message: 'Productos frescos recién llegados' },
      { title: 'Recordatorio', message: 'No olvides visitar el mercado hoy' }
    ];
    
    console.log('Notificaciones:', mockNotifications);
    
    // Aquí podría implementarse la navegación a una página de notificaciones
    // o mostrar un modal con la lista de notificaciones
  }

  /**
   * Muestra información sobre los VLCoins
   */
  async showVLCoinsInfo() {
    if (!this.isAuthenticated) {
      // If not authenticated, redirect to login
      this.showLoginRequiredToast('iniciar sesión para acceder a VL Coins');
      return;
    }

    console.log('Mostrando información de VLCoins');
    
    try {
      const modal = await this.modalController.create({
        component: VlcoinModalComponent,
        cssClass: 'vlcoin-modal'
      });
      
      await modal.present();

      // Añadir efecto visual al icono
      const vlCoinIcon = document.querySelector('.wallet-button .vl-coin-icon');
      if (vlCoinIcon) {
        vlCoinIcon.classList.add('wallet-pulse');
        setTimeout(() => {
          vlCoinIcon.classList.remove('wallet-pulse');
        }, 800);
      }
      
      // Get result from modal to check if balance was updated
      const { data } = await modal.onWillDismiss();
      if (data && data.balanceUpdated) {
        // Refresh the balance from the database
        // Get the current user using firstValueFrom
        const user = await new Promise<any>(resolve => {
          this.authService.user$.pipe(
            takeUntil(this.destroy$),
            take(1)
          ).subscribe(user => resolve(user));
        });
        
        if (user && user.id) {
          await this.vlcoinService.getVlcoinBalance(user.id);
        }
      }
    } catch (error) {
      console.error('Error al abrir el modal de VLCoins:', error);
      
      // Mostrar fallback toast si hay error
      const toast = await this.toastController.create({
        message: `Tienes ${this.vlcoinBalance} VLCoins disponibles`,
        duration: 2000,
        position: 'top',
        color: 'warning'
      });
      
      await toast.present();
    }
  }

  // Add a method to display login required message
  async showLoginRequiredToast(action: string) {
    const toast = await this.toastController.create({
      message: `Debes ${action}`,
      duration: 3000,
      position: 'bottom',
      buttons: [
        {
          text: 'Iniciar sesión',
          role: 'action',
          handler: () => {
            this.navigateToLogin();
          }
        }
      ],
      color: 'primary',
      cssClass: 'notification-toast'
    });
    
    await toast.present();
  }

  /**
   * Maps category names to their corresponding icons
   */
  getCategoryIcon(category: string): string {
    const iconMap: {[key: string]: string} = {
      'Todos': 'storefront',
      'Fruterías': 'basketOutline',
      'Carnicerías': 'restaurantOutline',
      'Pescaderías': 'fishOutline',
      'Panaderías': 'fastFoodOutline',
      'Lácteos': 'waterOutline',
      'Orgánicos': 'leafOutline',
      'Vinos': 'wineOutline',
      'Gourmet': 'restaurantOutline',
      'Herramientas': 'constructOutline',
      'Especialidad': 'pizzaOutline',
      'Papelería': 'documentOutline',
      'Juguetería': 'gameControllerOutline',
      'Perfumería': 'flowerOutline',
      'Licores': 'beerOutline'
    };
    
    return iconMap[category] || 'storefront';
  }

  /**
   * Shows a toast message
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1200,
      position: 'top',
      color: 'success',
      cssClass: 'subtle-toast'
    });
    await toast.present();
  }

  /**
   * Opens the filter options popover when clicking the filter button
   */
  presentFilterOptions(event: Event) {
    this.isFilterPopoverOpen = true;
    this.filterPopover.event = event;
  }

  /**
   * Selects a filter option from the popover and closes it
   */
  selectFilterOption(sortOption: string) {
    // If the same filter is already selected, do nothing
    if (this.selectedSort === sortOption) {
      this.isFilterPopoverOpen = false;
      return;
    }
    
    // Debug actual state before change
    this.debugFilterState('Before filter change');
    
    // Update the selected sort option
    this.selectedSort = sortOption;
    
    // Apply filters with the new sort option
    this.applyFilters();
    
    // Close the popover
    this.isFilterPopoverOpen = false;
    
    // Provide feedback
    console.log(`Aplicando filtro: ${sortOption}`);
    
    // Debug new state after change
    this.debugFilterState('After filter change');
    
    // Add visual feedback (optional)
    let message = '';
    switch (sortOption) {
      case 'distance':
        message = 'Mostrando tiendas más cercanas';
        break;
      case 'rating':
        message = 'Mostrando tiendas mejor valoradas';
        break;
      case 'offers':
        message = 'Mostrando tiendas con ofertas';
        break;
      default:
        message = 'Mostrando tiendas destacadas';
    }
    this.showToast(message);
    
    // Force change detection and UI update
    this.forceUpdate();
  }

  /**
   * Maneja la entrada de búsqueda desde el input personalizado
   */
  updateSearchTerm(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const term = inputElement.value.trim();
    
    // Ejecutar búsqueda después de escribir al menos 2 caracteres
    // o resetear si está vacío
    this.searchTerms.next(term);
    
    console.log('Término de búsqueda actualizado:', term);
  }

  /**
   * Devuelve la URL de imagen SVG para cada categoría con implementación optimizada
   */
  getCategoryImage(category: string): string {
    const mainColor = '02A396';
    
    // Para todas las categorías, usar SVG con iconos blancos
    const svgMap: {[key: string]: string} = {
      'Todos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M30 35h40v30H30zm5 5h30v20H35z' fill='white'/%3E%3C/svg%3E`,
      
      'Fruterías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M25 65c0 0 10 10 25 10s25-10 25-10H25z' fill='white'/%3E%3Ccircle cx='38' cy='45' r='10' fill='white'/%3E%3Cpath d='M38 35v-5' stroke='white' stroke-width='3'/%3E%3Ccircle cx='50' cy='40' r='10' fill='white'/%3E%3Cpath d='M50 30v-5' stroke='white' stroke-width='3'/%3E%3Ccircle cx='62' cy='45' r='10' fill='white'/%3E%3Cpath d='M62 35v-5' stroke='white' stroke-width='3'/%3E%3C/svg%3E`,
      
      'Carnicerías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M30 30 L70 30 C70 30 65 40 50 40 C35 40 30 30 30 30 Z' fill='white'/%3E%3Cpath d='M35 40 L35 65 C35 70 50 70 50 65 C50 70 65 70 65 65 L65 40' fill='white'/%3E%3Cpath d='M40 35 L45 35 M55 35 L60 35 M45 50 L55 50' stroke='white' stroke-width='2'/%3E%3C/svg%3E`,
      
      'Pescaderías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M25 50c15-20 35-20 50 0-15 20-35 20-50 0zm40-5c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z' fill='white'/%3E%3C/svg%3E`,
      
      'Panaderías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M30 40c0-5.5 4.5-10 10-10h20c5.5 0 10 4.5 10 10v20H30V40zm5 0v15h30V40c0-2.8-2.2-5-5-5H40c-2.8 0-5 2.2-5 5z' fill='white'/%3E%3C/svg%3E`,
      
      'Lácteos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M35 30l5 10v30h20V40l5-10H35zm5 5h20l-2.5 5h-15l-2.5-5z' fill='white'/%3E%3C/svg%3E`,
      
      'Orgánicos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M30 50c0 0 5-25 20-25 15 0 20 25 20 25s-5 25-20 25c-15 0-20-25-20-25z' fill='none' stroke='white' stroke-width='3'/%3E%3Cpath d='M30 50h40M50 25v50' stroke='white' stroke-width='3'/%3E%3Ccircle cx='50' cy='50' r='10' fill='white'/%3E%3C/svg%3E`,
      
      'Vinos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M40 25h20l-5 25v20h5v5H40v-5h5V50l-5-25zm5 5l3 15h4l3-15h-10z' fill='white'/%3E%3C/svg%3E`,
      
      'Gourmet': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M30 60h40v5H30zm35-5c0-15-15-25-15-25S35 40 35 55h30zm-15-30v5' stroke='white' stroke-width='3' fill='none'/%3E%3C/svg%3E`,
      
      'Herramientas': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M65 35L50 50v10h5l15-15v-10h-5zM35 65L50 50l5 5-15 15h-5v-5z' fill='white'/%3E%3C/svg%3E`,
      
      'Especialidad': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M50 25l8 17h17l-13 13 5 17-17-8-17 8 5-17-13-13h17z' fill='white'/%3E%3C/svg%3E`,
      
      'Papelería': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M35 30v40h30V30H35zm5 5h20v30H40V35z' fill='white'/%3E%3Cpath d='M45 40h10v5H45zm0 10h10v5H45z' fill='white'/%3E%3C/svg%3E`,
      
      'Juguetería': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M30 40c0-2.8 2.2-5 5-5h30c2.8 0 5 2.2 5 5v20c0 2.8-2.2 5-5 5H35c-2.8 0-5-2.2-5-5V40zm5 0v20h30V40H35z' fill='white'/%3E%3Ccircle cx='40' cy='45' r='3' fill='white'/%3E%3Ccircle cx='60' cy='45' r='3' fill='white'/%3E%3Cpath d='M40 55h20v3H40z' fill='white'/%3E%3C/svg%3E`,
      
      'Perfumería': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M40 30h20v10H40z' fill='white'/%3E%3Cpath d='M35 40h30v30H35z' fill='white'/%3E%3Cpath d='M45 40v-5h10v5M40 50h20M40 60h20' stroke='white' stroke-width='2'/%3E%3C/svg%3E`,
      
      'Licores': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M35 25h30v15l-12 25v10h12v5H35v-5h12V65L35 40V25zm5 5v5h20v-5H40z' fill='white'/%3E%3C/svg%3E`
    };
    
    return svgMap[category] || svgMap['Todos'];
  }

  /**
   * Loads mock store data for testing when no real data is available
   */
  private loadMockStores() {
    console.log('Loading mock stores for testing');
    
    // Create mock stores with different categories to test filtering
    this.stores = [
      {
        id: '1',
        name: 'Frutería Valencia',
        description: 'Las mejores frutas de la temporada',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'C/ Mercado, 12',
        openTime: '8:00 - 20:00',
        rating: 4.7,
        categories: ['Fruterías'],
        hasOffers: true,
        distance: 0.8
      },
      {
        id: '2',
        name: 'Carnicería El Toro',
        description: 'Carnes seleccionadas de primera calidad',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'Avda. Reino, 45',
        openTime: '9:00 - 19:00',
        rating: 4.5,
        categories: ['Carnicerías'],
        hasOffers: false,
        distance: 1.2
      },
      {
        id: '3',
        name: 'Pescadería Mar Azul',
        description: 'Pescado fresco diariamente',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'C/ Mayor, 22',
        openTime: '7:00 - 14:00',
        rating: 4.9,
        categories: ['Pescaderías'],
        hasOffers: true,
        distance: 0.5
      },
      {
        id: '4',
        name: 'Panadería La Hogaza',
        description: 'Pan artesano y bollería tradicional',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'Plaza Central, 4',
        openTime: '7:00 - 20:00',
        rating: 4.3,
        categories: ['Panaderías'],
        hasOffers: true,
        distance: 0.3
      },
      {
        id: '5',
        name: 'Lácteos El Pasturage',
        description: 'Productos lácteos artesanales',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'C/ Comercio, 8',
        openTime: '9:00 - 18:00',
        rating: 4.6,
        categories: ['Lácteos'],
        hasOffers: false,
        distance: 1.5
      },
      {
        id: '6',
        name: 'Ecotienda Verde',
        description: 'Productos ecológicos y sostenibles',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'C/ Botánico, 17',
        openTime: '10:00 - 20:00',
        rating: 4.8,
        categories: ['Orgánicos'],
        hasOffers: true,
        distance: 2.1
      },
      {
        id: '7',
        name: 'Vinoteca Bacus',
        description: 'Selección de vinos nacionales e internacionales',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'Avda. Constitución, 32',
        openTime: '11:00 - 21:00',
        rating: 4.7,
        categories: ['Vinos'],
        hasOffers: false,
        distance: 1.7
      },
      {
        id: '8',
        name: 'Gourmet del Chef',
        description: 'Productos gourmet para chef exigentes',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'C/ Salamanca, 9',
        openTime: '10:00 - 19:00',
        rating: 4.9,
        categories: ['Gourmet'],
        hasOffers: true,
        distance: 0.9
      },
      {
        id: '9',
        name: 'Delicatessen Europa',
        description: 'Productos delicatessen importados',
        imageUrl: 'assets/stores/default-store.jpg',
        location: 'C/ Colón, 25',
        openTime: '9:30 - 20:00',
        rating: 4.4,
        categories: ['Herramientas'],
        hasOffers: false,
        distance: 1.3
      }
    ];
    
    console.log('Loaded', this.stores.length, 'mock stores');
  }

  /**
   * Debug helper method to print filter state and store counts
   */
  private debugFilterState(prefix: string) {
    console.log(`${prefix} - FILTER STATE:`, {
      category: this.selectedCategory,
      sort: this.selectedSort,
      searchTerm: this.searchTerm,
      allStoresCount: this.allStores.length,
      filteredStoresCount: this.filteredStores.length
    });
  }
  
  /**
   * Forces the Angular change detection to update the UI
   */
  private forceUpdate() {
    this.zone.run(() => {
      console.log('Forzando actualización de la UI');
      // Esto desencadenará la detección de cambios
      this.changeDetector.detectChanges();
      
      // Aplicar una pequeña animación a los botones de favoritos
      setTimeout(() => {
        const favoriteButtons = document.querySelectorAll('.favorite-button');
        favoriteButtons.forEach(button => {
          button.classList.add('highlight');
          setTimeout(() => {
            button.classList.remove('highlight');
          }, 500);
        });
      }, 100);
    });
  }

  /**
   * Abre el chat con la IA como modal
   */
  async openAiChat() {
    try {
      const modal = await this.modalController.create({
        component: AiChatComponent,
        componentProps: {},
        cssClass: 'ai-chat-modal'
      });
      
      await modal.present();
      
    } catch (error) {
      console.error('Error al abrir el chat de IA:', error);
      this.showToast('Error al abrir el asistente de IA');
    }
  }

  /**
   * Abre la cámara para escanear texto usando Tesseract.js
   */
  async openScanner() {
    try {
      // Mostrar loading
      const loading = await this.loadingController.create({
        message: 'Iniciando cámara...',
        spinner: 'circles'
      });
      await loading.present();

      try {
        // Abrir la cámara
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          promptLabelHeader: 'Escanear texto',
          promptLabelPicture: 'Tomar foto',
          promptLabelCancel: 'Cancelar'
        });

        if (!image.dataUrl) {
          await loading.dismiss();
          this.showToast('No se pudo obtener la imagen');
          return;
        }

        loading.message = 'Analizando texto...';
        
        try {
          // Inicializar worker con idioma español
          const worker = await createWorker('spa');

          // Procesar la imagen
          const result = await worker.recognize(image.dataUrl);
          console.log('Resultado OCR:', result);
          
          // Extraer y limpiar el texto
          const scannedText = this.cleanScannedText(result.data.text);
          
          // Liberar recursos
          await worker.terminate();
          await loading.dismiss();
          
          if (scannedText) {
            // Usar el texto para buscar
            this.searchTerm = scannedText;
            this.searchStores();
            this.showToast(`Texto detectado: "${scannedText}"`);
          } else {
            this.showAlert(
              'No se pudo detectar texto en la imagen', 
              'Intenta nuevamente con mejor iluminación o una imagen más clara.'
            );
          }
        } catch (ocrError) {
          console.error('Error al procesar OCR:', ocrError);
          await loading.dismiss();
          
          // Si falla Tesseract, mostrar mensaje específico
          this.showAlert(
            'Error al procesar el texto', 
            'No se pudo analizar la imagen correctamente. Intenta de nuevo con una imagen de mejor calidad.'
          );
        }
      } catch (cameraError: any) {
        console.error('Error con la cámara:', cameraError);
        await loading.dismiss();
        
        if (cameraError.message !== 'User cancelled photos app') {
          this.showToast('No se pudo acceder a la cámara');
        }
      }
    } catch (generalError: any) {
      console.error('Error general al escanear:', generalError);
      this.loadingController.dismiss();
      this.showToast('Ocurrió un error inesperado');
    }
  }

  /**
   * Limpia el texto escaneado para mejorar la búsqueda
   */
  private cleanScannedText(text: string): string {
    if (!text) return '';
    
    // Eliminar saltos de línea y caracteres especiales
    let cleaned = text.replace(/[\r\n\t]/g, ' ');
    
    // Eliminar múltiples espacios
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Truncar si es muy largo (para búsqueda)
    if (cleaned.length > 50) {
      cleaned = cleaned.substring(0, 50);
    }
    
    return cleaned.trim();
  }

  /**
   * Muestra una alerta con información
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    
    await alert.present();
  }

  openNotificationPopover(event: Event) {
    if (!this.isAuthenticated) {
      this.navigateToLogin();
      return;
    }
    this.notificationPopoverOpen = true;
    this.notificationPopoverEvent = event;
  }

  closeNotificationPopover() {
    this.notificationPopoverOpen = false;
  }

  removeNotification(id: string) {
    if (!this.isAuthenticated) {
      return;
    }
    
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationCount = this.notifications.length;
  }

  onNotificationClick(n: any) {
    if (!this.isAuthenticated) {
      this.showLoginRequiredToast('iniciar sesión para ver notificaciones');
      return;
    }
    
    // Aplicar efecto de feedback visual
    this.applyFeedbackAnimation(n.type);
    
    // Cerrar el popover inmediatamente para evitar que permanezca abierto
    this.notificationPopoverOpen = false;
    
    if (n.type === 'oferta' && n.storeId) {
      // Utilizar setTimeout para asegurar que el popover se cierra antes de navegar
      setTimeout(() => {
        this.viewStore(n.storeId);
      }, 100);
    } else if (n.type === 'reto') {
      setTimeout(() => {
        this.showVLCoinsWithTab('challenges');
      }, 100);
    } else if (n.type === 'recompensa') {
      setTimeout(() => {
        this.showVLCoinsWithTab('rewards');
      }, 100);
    }
  }
  
  // Método para aplicar animación de feedback visual según el tipo de notificación
  private applyFeedbackAnimation(type: string) {
    let iconName: string;
    let color: string;
    
    switch (type) {
      case 'reto':
        iconName = 'trophy';
        color = 'warning';
        break;
      case 'recompensa':
        iconName = 'gift';
        color = 'tertiary';
        break;
      case 'oferta':
        iconName = 'pricetag';
        color = 'success';
        break;
      default:
        iconName = 'notifications';
        color = 'primary';
    }
    
    // Mostrar un toast con un icono que indique el tipo de notificación
    this.showToastWithIcon(
      `Abriendo detalles...`, 
      iconName,
      color
    );
  }
  
  // Método para mostrar un toast con icono
  private async showToastWithIcon(message: string, iconName: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      cssClass: `toast-with-icon toast-icon-${color}`,
      color: 'light',
      buttons: [
        {
          side: 'start',
          icon: iconName
        }
      ]
    });
    
    await toast.present();
  }

  // Método para mostrar el modal VLCoins con una pestaña específica
  async showVLCoinsWithTab(tab: string) {
    try {
      const modal = await this.modalController.create({
        component: VlcoinModalComponent,
        cssClass: 'vlcoin-modal',
        componentProps: {
          selectedSegment: tab
        }
      });
      
      await modal.present();
      
      // Añadir efecto visual al icono
      const vlCoinIcon = document.querySelector('.wallet-button .vl-coin-icon');
      if (vlCoinIcon) {
        vlCoinIcon.classList.add('wallet-pulse');
        setTimeout(() => {
          vlCoinIcon.classList.remove('wallet-pulse');
        }, 800);
      }
      
      // Get result from modal to check if balance was updated
      const { data } = await modal.onWillDismiss();
      if (data && data.balanceUpdated) {
        // Refresh the balance from the database
        const user = await this.authService.user$.toPromise();
        if (user && user.id) {
          await this.vlcoinService.getVlcoinBalance(user.id);
        }
      }
    } catch (error) {
      console.error('Error al abrir el modal de VLCoins:', error);
      this.showToast('Error al mostrar los detalles. Inténtalo de nuevo.');
    }
  }

  getStoreById(storeId: string) {
    return this.allStores.find(s => s.id === storeId);
  }

  // Add method to navigate to login page
  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFavorite(storeId: string): boolean {
    return this.userFavorites.includes(storeId);
  }

  async toggleFavorite(store: any, event: Event) {
    event.stopPropagation();
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.showLoginRequiredToast('favoritos');
      return;
    }
    const storeId = store.id;
    if (this.isFavorite(storeId)) {
      await this.supabaseService.removeFavorite(user.id, storeId, 'store');
      this.userFavorites = this.userFavorites.filter(id => id !== storeId);
      this.showToast('Eliminado de favoritos');
    } else {
      await this.supabaseService.addFavorite(user.id, storeId, 'store');
      this.userFavorites.push(storeId);
      this.showToast('Añadido a favoritos');
    }
  }
}

// Añadir función de distancia de Levenshtein para fuzzy search FUERA de la clase
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let j = 0; j <= an; ++j) matrix[0][j] = j;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}