import { Component, OnInit, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { 
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent, 
  IonFab,
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
  searchOutline,
  search,
  notifications, 
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
  cash
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
    IonFab,
    IonFabButton,
    IonPopover,
    IonBadge,
    IonSegment,
    IonSegmentButton
  ]
})
export class StoresPage implements OnInit {
  @ViewChild('filterPopover') filterPopover!: IonPopover;
  @ViewChild('notificationPopover') notificationPopover!: IonPopover;
  
  // Add property for controlling the popover visibility
  isFilterPopoverOpen = false;
  notificationPopoverOpen = false;
  notificationPopoverEvent: any = null;
  
  isDarkMode = false;
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
    'Delicatessen',
    'Especialidad'
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
    private vlcoinService: VlcoinService
  ) {
    addIcons({
      locationOutline,
      chevronDownOutline,
      notificationsOutline,
      searchOutline,
      optionsOutline,
      star,
      timeOutline,
      arrowForwardOutline,
      notifications,
      search,
      trendingUp,
      location,
      time,
      storefront,
      arrowForward,
      map,
      starHalf,
      sunny,
      moon,
      camera,
      shirtOutline,
      pizzaOutline,
      fishOutline,
      basketOutline,
      wineOutline,
      leafOutline,
      restaurantOutline,
      fastFoodOutline,
      waterOutline,
      chatbubbleEllipses,
      scanOutline,
      walletOutline,
      cash
    });

    // Check if dark mode was previously selected
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkMode = JSON.parse(savedDarkMode);
      this.applyTheme();
    }

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

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    this.applyTheme();
  }

  private applyTheme() {
    document.body.classList.toggle('dark', this.isDarkMode);
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
    const target = event.target as HTMLImageElement;
    if (target) {
      console.error('Error cargando imagen:', {
        failedUrl: target.src,
        storeName: target.alt
      });

      // Obtener la URL de la imagen por defecto del bucket
      const defaultImageUrl = this.supabaseService.getClient()
        .storage
        .from('fotostiendas')
        .getPublicUrl('default-store.jpg')
        .data
        .publicUrl;

      target.src = defaultImageUrl;
    }
  }

  async viewStore(storeId: string) {
    console.log('Navegando a la tienda con ID:', storeId);
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
        const user = await this.authService.user$.toPromise();
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
      'Delicatessen': 'pizzaOutline'
    };
    
    return iconMap[category] || 'storefront';
  }

  /**
   * Shows a toast message
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
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
    const svgMap: {[key: string]: string} = {
      'Todos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M32 38c0-1.1.9-2 2-2h32c1.1 0 2 .9 2 2v28c0 1.1-.9 2-2 2H34c-1.1 0-2-.9-2-2V38zm8-6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6H40v-6z' fill='white'/%3E%3C/svg%3E`,
      'Fruterías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M50 68c9.4 0 17-7.6 17-17s-7.6-17-17-17-17 7.6-17 17 7.6 17 17 17zm0-6c-6.1 0-11-4.9-11-11s4.9-11 11-11 11 4.9 11 11-4.9 11-11 11z' fill='white'/%3E%3Cpath d='M55 27c0 5.5 10 8 10 2s-2-10-10-2zM45 27c0 5.5-10 8-10 2s2-10 10 2z' fill='white'/%3E%3C/svg%3E`,
      'Carnicerías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M32 35c0-2.2 1.8-4 4-4h28c2.2 0 4 1.8 4 4v30c0 2.2-1.8 4-4 4H36c-2.2 0-4-1.8-4-4V35zm5 0c0-.6.4-1 1-1h24c.6 0 1 .4 1 1v5H37v-5zm0 10h26v15c0 .6-.4 1-1 1H38c-.6 0-1-.4-1-1V45z' fill='white'/%3E%3C/svg%3E`,
      'Pescaderías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M30 50c0-5.5 10-10 20-10s20 4.5 20 10-10 10-20 10-20-4.5-20-10zm35 0c3 0 5 7 10 0l5 5-5 5c-5-7-7 0-10 0-3-2.5-8-5-15-5s-12 2.5-15 5c-3 0-5-7-10 0l-5-5 5-5c5 7 7 0 10 0 3-2.5 8-5 15-5s12 2.5 15 5z' fill='white'/%3E%3Ccircle cx='40' cy='47' r='3' fill='white'/%3E%3C/svg%3E`,
      'Vinos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M50 65v8h-8v4h24v-4h-8v-8c7.7-1.5 13-4.2 13-12V35c0-1.1-.9-2-2-2H39c-1.1 0-2 .9-2 2v18c0 7.8 5.3 10.5 13 12zm-9-28h26v10H41V37zm13 24c-6 0-9-3-9-6V51h18v4c0 3-3 6-9 6z' fill='white'/%3E%3C/svg%3E`,
      'Panaderías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M25 45c0-8 6-15 15-15 4 0 7.5 1.5 10 4 2.5-2.5 6-4 10-4 9 0 15 7 15 15 0 10-10 15-25 25-15-10-25-15-25-25zm5 0c0 6 8 10 20 18 12-8 20-12 20-18 0-5-3-10-10-10-3 0-6 1.5-8 4l-2 2-2-2c-2-2.5-5-4-8-4-7 0-10 5-10 10z' fill='white'/%3E%3C/svg%3E`,
      'Lácteos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M37 28c-1.1 0-1.7 1.2-1 2l4 4v36c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V34l4-4c.7-.8.1-2-1-2H37zm5 6h16v6H42v-6zm0 10h16v22H42V44z' fill='white'/%3E%3Ccircle cx='50' cy='34' r='3' fill='white'/%3E%3C/svg%3E`,
      'Orgánicos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M35 70c-2 0-5-2-5-5 0-15 10-28 20-35 8 5 15 15 17 25 1-5 4-10 8-13 0 10-3 20-10 28H35zm25-26c-2-5-6-10-10-13-7 5-15 15-15 27v2h28c-1-5-2-11-3-16z' fill='white'/%3E%3C/svg%3E`,
      'Gourmet': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M38 30c-1.1 0-2 .9-2 2v36c0 1.1.9 2 2 2s2-.9 2-2V51h20v17c0 1.1.9 2 2 2s2-.9 2-2V32c0-1.1-.9-2-2-2s-2 .9-2 2v15H40V32c0-1.1-.9-2-2-2zm12 24c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z' fill='white'/%3E%3C/svg%3E`,
      'Delicatessen': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpath d='M50 25c-13.8 0-25 11.2-25 25s11.2 25 25 25 25-11.2 25-25-11.2-25-25-25zm0 44c-10.5 0-19-8.5-19-19s8.5-19 19-19 19 8.5 19 19-8.5 19-19 19zm8-19c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z' fill='white'/%3E%3Cpath d='M36 36l28 28M36 64l28-28' stroke='white' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E`,
      'Especialidad': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Cpolygon points='50,25 58,42 77,44 62,57 66,75 50,65 34,75 38,57 23,44 42,42' fill='white'/%3E%3C/svg%3E`
    };
    return svgMap[category] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23${mainColor}'/%3E%3Cstop offset='100%25' stop-color='%2301877c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='url(%23a)'/%3E%3Ctext x='50' y='55' font-family='Arial, sans-serif' font-size='30' text-anchor='middle' fill='white' dominant-baseline='middle'%3E${category.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
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
        categories: ['Delicatessen'],
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
      // This will trigger change detection
      this.changeDetector.detectChanges();
      console.log('Forced UI update with new filters');
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
    this.notificationPopoverOpen = true;
    this.notificationPopoverEvent = event;
  }

  closeNotificationPopover() {
    this.notificationPopoverOpen = false;
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationCount = this.notifications.length;
  }

  onNotificationClick(n: any) {
    if (n.type === 'oferta' && n.storeId) {
      this.closeNotificationPopover();
      this.viewStore(n.storeId);
    }
    // Puedes añadir más acciones según el tipo
  }

  getStoreById(storeId: string) {
    return this.allStores.find(s => s.id === storeId);
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