import { Component, OnInit, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { 
  IonBadge,
  IonButton,
  IonButtons,
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
  IonSpinner,
  IonToolbar
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
  shirtOutline,
  pizzaOutline,
  fishOutline,
  basketOutline,
  wineOutline,
  leafOutline,
  restaurantOutline,
  fastFoodOutline,
  waterOutline
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';

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
    IonToolbar,
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
    IonButtons,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonPopover,
    IonBadge
  ]
})
export class StoresPage implements OnInit {
  @ViewChild('filterPopover') filterPopover!: IonPopover;
  
  // Add property for controlling the popover visibility
  isFilterPopoverOpen = false;
  
  isDarkMode = false;
  selectedCategory: string = 'Todos';
  selectedSort: string = 'default';
  isLoading = false;
  searchTerm: string = '';
  showSearchBar: boolean = false;
  notificationCount: number = 0; // Contador de notificaciones
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
    'Delicatessen'
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

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastController: ToastController,
    private zone: NgZone,
    private changeDetector: ChangeDetectorRef
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
      waterOutline
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
    try {
      // Aplicar filtros inmediatamente para evitar recálculos innecesarios
      this.applyFilters();
      
      // Cargar datos en segundo plano
      setTimeout(async () => {
        try {
          const storesData = await this.supabaseService.getStores();
          
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
                categories: store.category ? [store.category] : ['Especialidad'],
                hasOffers: store.has_offers || false,
                distance: store.distance || 1.0
              };
            });
          } else {
            // Solo cargar datos de prueba si no hay datos reales
            this.loadMockStores();
          }
          
          // Guardar copia para filtrado y aplicar filtros
          this.allStores = [...this.stores];
          this.applyFilters();
          
          // Simular notificaciones
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
      
      // Score-based search algorithm
      result = result
        .map(store => {
          let score = 0;
          const nameMatch = store.name.toLowerCase().includes(term);
          const descMatch = store.description?.toLowerCase()?.includes(term);
          const categoryMatch = store.categories?.some(cat => cat.toLowerCase().includes(term));
          const locationMatch = store.location?.toLowerCase()?.includes(term);
          
          // Score different types of matches
          if (store.name.toLowerCase() === term) score += 10;
          else if (nameMatch) score += 5;
          
          if (descMatch) score += 3;
          if (categoryMatch) score += 4;
          if (locationMatch) score += 2;
          
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
        store.categories?.includes(this.selectedCategory) || 
        store.category === this.selectedCategory
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
  private simulateNotifications() {
    // Mostrar 2 notificaciones iniciales
    this.notificationCount = 2;
    
    // Simular una nueva notificación cada 30 segundos
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% de probabilidad de una nueva notificación
        this.notificationCount++;
      }
    }, 30000);
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
   * Opens the camera to take product photos
   */
  async takeProductPhoto() {
    try {
      // Check if we're on a device with camera access
      if (!('Camera' in window)) {
        this.showToast('La cámara no está disponible en este dispositivo');
        return;
      }
      
      // Here we would integrate with Camera API
      // For now just show a toast
      this.showToast('Función de cámara en desarrollo');
      
      // In a real implementation, you would:
      // 1. Open the camera
      // 2. Take a photo
      // 3. Process the photo
      // 4. Upload or save it
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      this.showToast('Error al acceder a la cámara');
    }
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
    // Mapa de colores de la paleta Artemis (predefinido para evitar cálculos repetidos)
    const colorMap: {[key: string]: string} = {
      'Todos': '02C39A',
      'Fruterías': '00A896',
      'Carnicerías': '05668D',
      'Pescaderías': '028090',
      'Panaderías': '02C39A',
      'Lácteos': '05668D',
      'Orgánicos': '00A896',
      'Vinos': '028090',
      'Gourmet': '05668D',
      'Delicatessen': '02C39A'
    };
    
    // Obtener el color de fondo
    const bgColor = colorMap[category] || '02C39A';
    
    // Mapa de SVGs precalculados
    const svgMap: {[key: string]: string} = {
      'Todos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M32 42 L32 68 L68 68 L68 42 L32 42 Z M40 42 L40 32 L60 32 L60 42 L40 42 Z' fill='white' stroke='white' stroke-width='1' /%3E%3C/svg%3E`,
      'Fruterías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Ccircle cx='50' cy='55' r='18' fill='white' /%3E%3Cpath d='M50 37 Q60 27 70 37' stroke='white' stroke-width='2' fill='none' /%3E%3C/svg%3E`,
      'Carnicerías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M35 40 L65 40 L65 65 L35 65 Z' fill='white' /%3E%3C/svg%3E`,
      'Pescaderías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M30 50 C40 40 60 40 70 50 C60 60 40 60 30 50 Z' fill='white' /%3E%3Ccircle cx='40' cy='50' r='3' fill='%23${bgColor}' /%3E%3Cpath d='M70 50 L75 45 L75 55 Z' fill='white' /%3E%3C/svg%3E`,
      'Vinos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M40 30 L60 30 L55 55 L45 55 Z' fill='white' /%3E%3Cpath d='M50 55 L50 70 M40 70 L60 70' stroke='white' stroke-width='2' /%3E%3C/svg%3E`,
      'Panaderías': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M30 50 C30 35 70 35 70 50 C70 65 30 65 30 50 Z' fill='white' /%3E%3C/svg%3E`,
      'Lácteos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M40 30 L60 30 L60 70 L40 70 Z' fill='white' /%3E%3Ccircle cx='50' cy='40' r='5' fill='%23${bgColor}' /%3E%3C/svg%3E`,
      'Orgánicos': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M30 70 C30 30 70 30 70 70' fill='none' stroke='white' stroke-width='5' /%3E%3Cpath d='M30 70 L70 70' stroke='white' stroke-width='5' /%3E%3C/svg%3E`,
      'Gourmet': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Cpath d='M40 30 L40 70 M60 30 L60 70 M40 50 L60 50' stroke='white' stroke-width='3' fill='none' /%3E%3C/svg%3E`,
      'Delicatessen': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Ccircle cx='50' cy='50' r='15' fill='white' /%3E%3Cpath d='M35 35 L65 65 M35 65 L65 35' stroke='white' stroke-width='3' /%3E%3C/svg%3E`
    };
    
    // Retornar el SVG precalculado o un SVG genérico si no existe
    return svgMap[category] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23${bgColor}' /%3E%3Ctext x='50' y='55' font-family='Arial, sans-serif' font-size='30' text-anchor='middle' fill='white' dominant-baseline='middle'%3E${category.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
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
} 