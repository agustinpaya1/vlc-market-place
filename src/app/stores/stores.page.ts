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
  IonSpinner
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
  searchOutline 
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';

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
    IonSpinner
  ]
})
export class StoresPage implements OnInit {
  isDarkMode = false;
  selectedCategory: string = 'Todos';
  selectedSort: string = 'default';
  isLoading = true;
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
  
  // Los datos de ejemplo de tiendas se mantendrán como respaldo
  fallbackStores: Store[] = [
    {
      id: '1',
      name: 'Mercado Central',
      description: 'El mercado más grande de Europa con productos frescos y locales',
      imageUrl: 'assets/stores/mercado-central.jpg',
      location: 'Plaza del Mercado, Valencia',
      openTime: '7:00 - 15:00',
      rating: 4.8,
      categories: ['Mercado', 'Frutas y Verduras', 'Carnicería', 'Pescadería'],
      hasOffers: true,
      distance: 0.5,
      products: [
        {
          id: 'mercado-1',
          name: 'Jamón Ibérico',
          category: 'Embutidos',
          description: 'Jamón ibérico de bellota de primera calidad',
          price: 89.99,
          stock: 20,
          image_url: 'assets/products/jamon.jpg'
        },
        {
          id: 'mercado-2',
          name: 'Queso Manchego',
          category: 'Lácteos',
          description: 'Queso manchego curado D.O.',
          price: 24.99,
          stock: 15,
          image_url: 'assets/products/queso.jpg'
        }
      ]
    },
    {
      id: '2',
      name: 'Panadería La Valenciana',
      description: 'Pan artesanal y pasteles tradicionales valencianos',
      imageUrl: 'assets/stores/panaderia.jpg',
      location: 'Calle Colón, Valencia',
      openTime: '6:00 - 21:00',
      rating: 4.5,
      categories: ['Panadería', 'Dulcería'],
      hasOffers: false,
      distance: 1.2,
      products: [
        {
          id: 'panaderia-1',
          name: 'Pan de Pueblo',
          category: 'Panadería',
          description: 'Pan artesanal de masa madre',
          price: 2.80,
          stock: 50,
          image_url: 'assets/products/pan.jpg'
        },
        {
          id: 'panaderia-2',
          name: 'Fartons',
          category: 'Dulcería',
          description: 'Perfectos para mojar en horchata',
          price: 4.50,
          stock: 30,
          image_url: 'assets/products/fartons.jpg'
        }
      ]
    },
    {
      id: '3',
      name: 'Frutas y Verduras El Ruzafa',
      description: 'Frutas y verduras frescas del huerta valenciana',
      imageUrl: 'assets/stores/fruteria.jpg',
      location: 'Barrio de Ruzafa, Valencia',
      openTime: '8:00 - 14:00, 17:00 - 20:00',
      rating: 4.6,
      categories: ['Frutas y Verduras'],
      hasOffers: true,
      distance: 0.8,
      products: [
        {
          id: 'fruteria-1',
          name: 'Naranjas Valencianas',
          category: 'Frutas',
          description: 'Naranjas dulces de temporada',
          price: 2.99,
          stock: 100,
          image_url: 'assets/products/naranjas.jpg'
        },
        {
          id: 'fruteria-2',
          name: 'Tomates Raf',
          category: 'Verduras',
          description: 'Tomates premium para ensalada',
          price: 4.99,
          stock: 45,
          image_url: 'assets/products/tomates.jpg'
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
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
      searchOutline
    });

    // Check if dark mode was previously selected
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkMode = JSON.parse(savedDarkMode);
      this.applyTheme();
    }
  }

  async ngOnInit() {
    this.isLoading = true;
    try {
      const storesData = await this.supabaseService.getStores();
      console.log('Datos de tiendas recibidos de Supabase:', storesData);
      console.log('Número de tiendas recibidas:', storesData ? storesData.length : 0);
      
      if (storesData && storesData.length > 0) {
        // Adaptar el formato de los datos de Supabase al formato de la aplicación
        this.stores = storesData.map(store => {
          return {
            id: store.id,
            name: store.name,
            description: store.description || '',
            imageUrl: store.image_url || 'assets/stores/default-store.jpg',
            location: store.location || 'Valencia',
            openTime: store.open_time || '9:00 - 20:00',
            rating: 4.5, // Valor por defecto
            categories: store.category ? [store.category] : ['Especialidad'],
            hasOffers: store.has_offers || false,
            distance: Math.random() * 2, // Distancia aleatoria entre 0-2km
            products: []
          };
        });
      } else {
        // Si no hay datos en Supabase, usar los datos de respaldo
        this.stores = this.fallbackStores;
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      this.stores = this.fallbackStores;
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
      target.src = 'assets/stores/default-store.jpg';
    }
  }

  async viewStore(storeId: string) {
    console.log('Navegando a la tienda con ID:', storeId);
    
    // Encontrar la tienda en el arreglo de fallbackStores para tener sus productos disponibles si es necesario
    const fallbackStore = this.fallbackStores.find(store => store.id === storeId);
    if (fallbackStore) {
      console.log('Tienda encontrada en fallback:', fallbackStore);
      console.log('Productos disponibles en fallback:', fallbackStore.products);
      localStorage.setItem('fallbackStoreProducts', JSON.stringify(fallbackStore.products));
    }
    
    this.router.navigate(['/store', storeId]);
  }
} 