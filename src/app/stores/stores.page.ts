import { Component, OnInit } from '@angular/core';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonImg,
  IonButton,
  IonIcon,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonSkeletonText,
  IonSpinner,
  IonItem,
  IonList,
  IonSearchbar
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
  search 
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AiSuggestionsService } from '../services/ai-suggestions.service';

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
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonImg,
    IonButton,
    IonIcon,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonSkeletonText,
    IonSpinner,
    IonSearchbar,
    IonList,
    IonItem
  ]
})
export class StoresPage implements OnInit {
  isDarkMode = false;
  selectedCategory: string = 'Todos';
  selectedSort: string = 'default';
  isLoading = false;
  searchTerm: string = '';
  showSearchBar: boolean = false;
  allStores: Store[] = []; // Original unfiltered stores
  categories: string[] = [
    'Todos',
    'Mercado',
    'Panadería',
    'Frutas y Verduras',
    'Carnicería',
    'Pescadería',
    'Supermercado',
    'Bodega',
    'Dulcería',
    'Especialidad',
    'Gourmet',
    'Quesos'
  ];

  sortOptions = [
    { value: 'default', label: 'Recomendados', icon: 'star' },
    { value: 'offers', label: 'Ofertas', icon: 'trendingUp' },
    { value: 'distance', label: 'Más cercanos', icon: 'map' },
    { value: 'rating', label: 'Mejor valorados', icon: 'starHalf' }
  ];

  stores: Store[] = [];
  searchSuggestions: string[] = [];
  showSuggestions: boolean = false;
  private searchTerms = new Subject<string>();

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private aiSuggestionsService: AiSuggestionsService
  ) {
    addIcons({
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
      search
    });

    // Check if dark mode was previously selected
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkMode = JSON.parse(savedDarkMode);
      this.applyTheme();
    }

    // Set up search suggestions
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      if (term.length > 2) {
        this.getAiSuggestions(term);
      } else {
        this.searchSuggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    try {
      const storesData = await this.supabaseService.getStores();
      console.log('Datos de tiendas recibidos de Supabase:', JSON.stringify(storesData, null, 2));
      
      if (storesData && storesData.length > 0) {
        this.stores = storesData.map(store => {
          const mappedStore = {
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
          console.log(`Tienda ${store.name} - URL de imagen:`, mappedStore.imageUrl);
          return mappedStore;
        });
        
        // Save a copy of all stores for search filtering
        this.allStores = [...this.stores];
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
    } finally {
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

  get filteredStores(): Store[] {
    let result = [...this.stores];

    // Aplicar filtro por categoría
    if (this.selectedCategory !== 'Todos') {
      result = result.filter(store => 
        store.categories?.includes(this.selectedCategory) || 
        store.category === this.selectedCategory
      );
    }

    // Ordenar según la opción seleccionada
    switch (this.selectedSort) {
      case 'distance':
        result.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'offers':
        // Priorizar tiendas con ofertas
        result.sort((a, b) => {
          if ((a.hasOffers || a.has_offers) && !(b.hasOffers || b.has_offers)) return -1;
          if (!(a.hasOffers || a.has_offers) && (b.hasOffers || b.has_offers)) return 1;
          return 0;
        });
        break;
      // default - mantener el orden predeterminado
    }

    console.log('Tiendas filtradas que se mostrarán:', result);
    console.log('Número de tiendas a mostrar:', result.length);
    return result;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    console.log('Categoría seleccionada:', this.selectedCategory);
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
    this.router.navigate(['/store', storeId]);
  }

  toggleSearch() {
    this.showSearchBar = !this.showSearchBar;
    if (!this.showSearchBar) {
      this.searchTerm = '';
      this.searchSuggestions = [];
      this.showSuggestions = false;
      this.stores = [...this.allStores]; // Restore original stores when search is closed
    }
  }

  onSearchInput(event: any) {
    const term = event.target.value.trim();
    console.log('Entrada de búsqueda:', term);
    this.searchTerms.next(term);
  }

  searchStores() {
    if (!this.searchTerm.trim()) {
      this.stores = [...this.allStores]; // Restore original stores when search is empty
      this.searchSuggestions = [];
      this.showSuggestions = false;
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    
    // Filter stores by name, description, categories, or products if available
    this.stores = this.allStores.filter(store => {
      const nameMatch = store.name.toLowerCase().includes(term);
      const descMatch = store.description?.toLowerCase().includes(term);
      const categoryMatch = store.categories?.some(cat => cat.toLowerCase().includes(term));
      
      // Also search within products if they are loaded
      const productMatch = store.products?.some(
        product => 
          product.name.toLowerCase().includes(term) || 
          product.category.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
      );
      
      return nameMatch || descMatch || categoryMatch || productMatch;
    });
    
    // Hide suggestions after search
    this.searchSuggestions = [];
    this.showSuggestions = false;
  }
  
  selectSuggestion(suggestion: string) {
    this.searchTerm = suggestion;
    this.searchStores();
    this.showSuggestions = false;
  }
  
  private getAiSuggestions(term: string) {
    console.log('Solicitando sugerencias para:', term);
    this.aiSuggestionsService.getSuggestions(term).subscribe(
      suggestions => {
        console.log('Sugerencias recibidas:', suggestions);
        this.searchSuggestions = suggestions;
        this.showSuggestions = this.searchSuggestions.length > 0;
        console.log('¿Mostrar sugerencias?', this.showSuggestions, 'Cantidad:', this.searchSuggestions.length);
      },
      error => {
        console.error('Error al obtener sugerencias:', error);
        this.searchSuggestions = [];
        this.showSuggestions = false;
      }
    );
  }
} 