import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '../interfaces/store.interface';
import { Product } from './product.interface';
import { addIcons } from 'ionicons';
import { 
  star, 
  location, 
  time, 
  pricetag, 
  cart, 
  arrowBack,
  searchOutline,
  sunny,
  moon
} from 'ionicons/icons';
import { CartService } from '../services/cart.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-store',
  templateUrl: './store.page.html',
  styleUrls: ['./store.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class StorePage implements OnInit {
  store: Store | undefined;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  isDarkTheme: boolean = false;
  cartItemsCount = 0;

  // Mock data for stores
  private stores = [
    {
      id: 1,
      name: 'Mercado Central',
      description: 'El mercado más emblemático de Valencia',
      imageUrl: '/assets/stores/mercado-central.jpg',
      location: 'Plaza del Mercado, Valencia',
      openTime: 'Lun-Sab: 7:00-15:00',
      rating: 4.8,
      categories: ['Mercado', 'Productos frescos'],
      hasOffers: true,
      distance: '0.5 km',
      products: [
        {
          id: 'mercado-1',
          name: 'Jamón Ibérico',
          category: 'Embutidos',
          description: 'Jamón ibérico de bellota de primera calidad',
          price: 89.99,
          offerPrice: 79.99,
          imageUrl: '/assets/products/jamon.jpg',
          inStock: true
        },
        {
          id: 'mercado-2',
          name: 'Queso Manchego',
          category: 'Lácteos',
          description: 'Queso manchego curado D.O.',
          price: 24.99,
          imageUrl: '/assets/products/queso.jpg',
          inStock: true
        }
      ]
    },
    {
      id: 3,
      name: 'Frutas y Verduras El Huerto',
      description: 'Los mejores productos de la huerta valenciana',
      imageUrl: '/assets/stores/fruteria.jpg',
      location: 'Calle de Ruzafa, 15',
      openTime: 'Lun-Sab: 8:00-20:00',
      rating: 4.6,
      categories: ['Frutas', 'Verduras'],
      hasOffers: true,
      distance: '0.8 km',
      products: [
        {
          id: 'fruteria-1',
          name: 'Naranjas Valencianas',
          category: 'Frutas',
          description: 'Naranjas dulces de temporada',
          price: 2.99,
          offerPrice: 2.49,
          imageUrl: '/assets/products/naranjas.jpg',
          inStock: true
        },
        {
          id: 'fruteria-2',
          name: 'Tomates Raf',
          category: 'Verduras',
          description: 'Tomates premium para ensalada',
          price: 4.99,
          imageUrl: '/assets/products/tomates.jpg',
          inStock: true
        }
      ]
    },
    {
      id: 2,
      name: 'Panadería La Valenciana',
      description: 'Pan artesanal y pasteles tradicionales',
      imageUrl: '/assets/stores/panaderia.jpg',
      location: 'Calle Colón, Valencia',
      openTime: 'Lun-Sab: 6:00-21:00',
      rating: 4.5,
      categories: ['Panadería', 'Dulcería'],
      hasOffers: true,
      distance: '1.2 km',
      products: [
        {
          id: 'panaderia-1',
          name: 'Pan de Pueblo',
          category: 'Panadería',
          description: 'Pan artesanal de masa madre',
          price: 2.80,
          imageUrl: '/assets/products/pan.jpg',
          inStock: true
        },
        {
          id: 'panaderia-2',
          name: 'Fartons',
          category: 'Dulcería',
          description: 'Perfectos para mojar en horchata',
          price: 4.50,
          offerPrice: 3.50,
          imageUrl: '/assets/products/fartons.jpg',
          inStock: true
        }
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private toastController: ToastController
  ) {
    addIcons({ star, location, time, pricetag, cart, arrowBack, searchOutline, sunny, moon });
    
    // Check if dark mode was previously selected
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkTheme = JSON.parse(savedDarkMode);
      this.applyTheme();
    }

    // Subscribe to cart changes
    this.cartService.cartItems$.subscribe(items => {
      this.cartItemsCount = this.cartService.getTotalItems();
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStoreData(Number(id));
    }
  }

  private loadStoreData(storeId: number) {
    const store = this.stores.find(s => s.id === storeId);
    if (store) {
      if (store.products && store.products.length > 0) {
        this.store = store;
        this.products = store.products;
        this.filteredProducts = [...this.products];
      } else {
        this.showNoProductsMessage();
        this.router.navigate(['/tabs/tab6']);
      }
    } else {
      this.router.navigate(['/tabs/tab6']);
    }
  }

  private async showNoProductsMessage() {
    const toast = await this.toastController.create({
      message: 'Esta tienda no tiene productos disponibles en este momento',
      duration: 3000,
      position: 'bottom',
      color: 'warning'
    });
    await toast.present();
  }

  filterProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product => 
      product.name.toLowerCase().includes(searchTermLower) ||
      product.category.toLowerCase().includes(searchTermLower) ||
      product.description.toLowerCase().includes(searchTermLower)
    );
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = '/assets/stores/default-store.jpg';
    }
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkTheme));
    this.applyTheme();
  }

  private applyTheme() {
    document.body.classList.toggle('dark', this.isDarkTheme);
  }

  async addToCart(product: Product) {
    this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.offerPrice || product.price,
      quantity: 1,
      imageUrl: product.imageUrl
    });

    const toast = await this.toastController.create({
      message: `${product.name} ha sido añadido al carrito`,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  goToCart() {
    this.router.navigate(['/tabs/cart']);
  }

  goBack() {
    this.router.navigate(['/tabs/tab6']);
  }
} 