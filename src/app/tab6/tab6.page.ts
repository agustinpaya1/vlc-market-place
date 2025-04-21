import { Component } from '@angular/core';
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
  IonButtons
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
  moon, searchOutline } from 'ionicons/icons';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isOffer?: boolean;
  offerPrice?: number;
  stock: number;
  unit: string; // kg, unidad, etc.
}

interface Store {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  openTime: string;
  rating: number;
  categories: string[];
  hasOffers: boolean;
  distance: number;
  products: Product[];
}

@Component({
  selector: 'app-tab6',
  templateUrl: './tab6.page.html',
  styleUrls: ['./tab6.page.scss'],
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
    IonButtons
  ]
})
export class Tab6Page {
  isDarkMode = false;
  selectedCategory: string = 'Todos';
  selectedSort: string = 'default';
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
    'Especialidad'
  ];

  sortOptions = [
    { value: 'default', label: 'Recomendados', icon: 'star' },
    { value: 'offers', label: 'Ofertas', icon: 'trendingUp' },
    { value: 'distance', label: 'Más cercanos', icon: 'map' },
    { value: 'rating', label: 'Mejor valorados', icon: 'starHalf' }
  ];

  stores: Store[] = [
    {
      id: 1,
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
          id: 1,
          name: 'Naranjas Valencianas',
          description: 'Naranjas dulces de temporada',
          price: 2.50,
          imageUrl: 'assets/products/naranjas.jpg',
          category: 'Frutas y Verduras',
          isOffer: true,
          offerPrice: 1.99,
          stock: 100,
          unit: 'kg'
        },
        {
          id: 2,
          name: 'Tomates Raf',
          description: 'Tomates premium para ensalada',
          price: 3.95,
          imageUrl: 'assets/products/tomates.jpg',
          category: 'Frutas y Verduras',
          stock: 50,
          unit: 'kg'
        }
      ]
    },
    {
      id: 2,
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
          id: 1,
          name: 'Pan de Pueblo',
          description: 'Pan artesanal de masa madre',
          price: 2.80,
          imageUrl: 'assets/products/pan.jpg',
          category: 'Panadería',
          stock: 30,
          unit: 'unidad'
        },
        {
          id: 2,
          name: 'Fartons',
          description: 'Perfectos para mojar en horchata',
          price: 4.50,
          imageUrl: 'assets/products/fartons.jpg',
          category: 'Dulcería',
          isOffer: true,
          offerPrice: 3.50,
          stock: 40,
          unit: 'pack'
        }
      ]
    },
    {
      id: 3,
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
          id: 1,
          name: 'Alcachofas',
          description: 'Alcachofas frescas de temporada',
          price: 3.20,
          imageUrl: 'assets/products/alcachofas.jpg',
          category: 'Verduras',
          isOffer: true,
          offerPrice: 2.50,
          stock: 45,
          unit: 'kg'
        },
        {
          id: 2,
          name: 'Fresas',
          description: 'Fresas dulces de Sagunto',
          price: 4.80,
          imageUrl: 'assets/products/fresas.jpg',
          category: 'Frutas',
          stock: 25,
          unit: 'kg'
        }
      ]
    },
    {
      id: 4,
      name: 'Carnicería El Carmen',
      description: 'Carnes selectas y embutidos tradicionales',
      imageUrl: 'assets/stores/carniceria.jpg',
      location: 'Barrio del Carmen, Valencia',
      openTime: '9:00 - 14:00, 17:00 - 20:00',
      rating: 4.4,
      categories: ['Carnicería'],
      hasOffers: false,
      distance: 1.5,
      products: []
    },
    {
      id: 5,
      name: 'Pescadería La Malvarrosa',
      description: 'Pescado fresco del Mediterráneo',
      imageUrl: 'assets/stores/pescaderia.jpg',
      location: 'Playa de la Malvarrosa, Valencia',
      openTime: '8:00 - 14:00',
      rating: 4.7,
      categories: ['Pescadería'],
      hasOffers: true,
      distance: 3.2,
      products: []
    },
    {
      id: 6,
      name: 'Supermercado El Grao',
      description: 'Supermercado local con productos de proximidad',
      imageUrl: 'assets/stores/supermercado.jpg',
      location: 'Barrio del Grao, Valencia',
      openTime: '8:00 - 22:00',
      rating: 4.3,
      categories: ['Supermercado'],
      hasOffers: true,
      distance: 2.8,
      products: []
    },
    {
      id: 7,
      name: 'Bodega La Alameda',
      description: 'Vinos valencianos y productos gourmet',
      imageUrl: 'assets/stores/bodega.jpg',
      location: 'Jardines de la Alameda, Valencia',
      openTime: '10:00 - 14:00, 17:00 - 21:00',
      rating: 4.9,
      categories: ['Bodega', 'Especialidad'],
      hasOffers: false,
      distance: 1.8,
      products: []
    },
    {
      id: 8,
      name: 'Dulcería La Fallera',
      description: 'Dulces tradicionales y horchata de chufa',
      imageUrl: 'assets/stores/dulceria.jpg',
      location: 'Plaza de la Virgen, Valencia',
      openTime: '9:00 - 21:00',
      rating: 4.8,
      categories: ['Dulcería'],
      hasOffers: true,
      distance: 0.3,
      products: []
    },
    {
      id: 9,
      name: 'Tienda de Paella El Cabanyal',
      description: 'Ingredientes para la auténtica paella valenciana',
      imageUrl: 'assets/stores/paella.jpg',
      location: 'Barrio de El Cabanyal, Valencia',
      openTime: '9:00 - 14:00, 17:00 - 20:00',
      rating: 4.7,
      categories: ['Especialidad', 'Supermercado'],
      hasOffers: false,
      distance: 2.5,
      products: []
    }
  ];

  constructor(private router: Router) {
    addIcons({trendingUp,location,time,storefront,star,arrowForward,searchOutline,map,starHalf,sunny,moon});

    // Check if dark mode was previously selected
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkMode = JSON.parse(savedDarkMode);
      this.applyTheme();
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    this.applyTheme();
  }

  private applyTheme() {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  get filteredStores(): Store[] {
    let filtered = this.stores;
    
    // Filtrar por categoría
    if (this.selectedCategory !== 'Todos') {
      filtered = filtered.filter(store => 
        store.categories.includes(this.selectedCategory)
      );
    }

    // Ordenar según la selección
    switch (this.selectedSort) {
      case 'offers':
        filtered = filtered.filter(store => store.hasOffers);
        break;
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Orden por defecto: primero las que tienen ofertas, luego por rating
        filtered.sort((a, b) => {
          if (a.hasOffers === b.hasOffers) {
            return b.rating - a.rating;
          }
          return a.hasOffers ? -1 : 1;
        });
    }

    return filtered;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  selectSort(sort: string) {
    this.selectedSort = sort;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/stores/default-store.jpg';
    }
  }

  viewStore(storeId: number) {
    console.log('Navigating to store:', storeId);
    this.router.navigate(['/tabs/store', storeId]);
  }
} 