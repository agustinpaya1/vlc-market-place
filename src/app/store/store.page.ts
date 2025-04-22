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
import { ToastController, LoadingController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';

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
  isLoading = true;

  // Tiendas de respaldo en caso de error
  private fallbackStores = [
    {
      id: '1',
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
      id: '3',
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
      id: '2',
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
    private toastController: ToastController,
    private loadingController: LoadingController,
    private supabaseService: SupabaseService
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

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadStoreData(id);
    }
  }

  private async loadStoreData(storeId: string) {
    const loading = await this.loadingController.create({
      message: 'Cargando tienda...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      // Obtener datos de la tienda de Supabase
      const storeData = await this.supabaseService.getStoreById(storeId);
      
      if (storeData) {
        // Adaptar el formato de los datos
        this.store = {
          id: storeData.id,
          name: storeData.name,
          description: storeData.description || 'Tienda local con productos de calidad',
          imageUrl: storeData.image_url || '/assets/stores/default-store.jpg',
          location: storeData.location || 'Valencia',
          openTime: storeData.open_time || '9:00 - 20:00',
          rating: storeData.rating || 4.5,
          categories: storeData.category ? [storeData.category] : ['Especialidad'],
          hasOffers: storeData.has_offers || false,
          distance: '1.2 km'
        };

        // Obtener productos de la tienda
        const productsData = await this.supabaseService.getStoreProducts(storeId);
        
        if (productsData && productsData.length > 0) {
          console.log('Productos obtenidos de Supabase:', productsData);
          this.products = productsData.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description || 'Producto de calidad local',
            price: product.price,
            offerPrice: product.price * 0.9, // Precio de oferta simulado
            imageUrl: product.image_url || '/assets/products/default-product.jpg',
            category: product.category || 'General',
            inStock: product.stock > 0
          }));
          this.filteredProducts = [...this.products];
        } else {
          // Si no hay productos en Supabase, intentar obtenerlos del localStorage
          const fallbackProductsJSON = localStorage.getItem('fallbackStoreProducts');
          if (fallbackProductsJSON) {
            const fallbackProducts = JSON.parse(fallbackProductsJSON);
            console.log('Productos obtenidos del localStorage:', fallbackProducts);
            
            if (fallbackProducts && fallbackProducts.length > 0) {
              this.products = fallbackProducts.map((product: any) => ({
                id: product.id,
                name: product.name,
                description: product.description || 'Producto de calidad local',
                price: product.price,
                offerPrice: product.price * 0.9, // Precio de oferta simulado
                imageUrl: product.image_url || '/assets/products/default-product.jpg',
                category: product.category || 'General',
                inStock: product.stock > 0
              }));
              this.filteredProducts = [...this.products];
            } else {
              // Si no hay productos en localStorage, usar los de respaldo
              const fallbackStore = this.fallbackStores.find(s => s.id === storeId);
              if (fallbackStore && fallbackStore.products) {
                console.log('Productos obtenidos del fallbackStore:', fallbackStore.products);
                this.products = fallbackStore.products;
                this.filteredProducts = [...this.products];
              } else {
                this.showNoProductsMessage();
              }
            }
          } else {
            // Si no hay productos en localStorage, usar los de respaldo
            const fallbackStore = this.fallbackStores.find(s => s.id === storeId);
            if (fallbackStore && fallbackStore.products) {
              console.log('Productos obtenidos del fallbackStore:', fallbackStore.products);
              this.products = fallbackStore.products;
              this.filteredProducts = [...this.products];
            } else {
              this.showNoProductsMessage();
            }
          }
        }
      } else {
        // Si no se encuentra la tienda, buscar en las de respaldo
        const fallbackStore = this.fallbackStores.find(s => s.id === storeId);
        if (fallbackStore) {
          this.store = fallbackStore;
          this.products = fallbackStore.products || [];
          this.filteredProducts = [...this.products];
        } else {
          this.showStoreNotFoundMessage();
          this.router.navigate(['/tabs/stores']);
        }
      }
    } catch (error) {
      console.error('Error al cargar la tienda:', error);
      // En caso de error, intentar cargar desde el respaldo
      const fallbackStore = this.fallbackStores.find(s => s.id === storeId);
      if (fallbackStore) {
        this.store = fallbackStore;
        this.products = fallbackStore.products || [];
        this.filteredProducts = [...this.products];
      } else {
        this.showErrorMessage();
        this.router.navigate(['/tabs/stores']);
      }
    } finally {
      this.isLoading = false;
      loading.dismiss();
      // Limpiar localStorage después de cargar
      localStorage.removeItem('fallbackStoreProducts');
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

  private async showStoreNotFoundMessage() {
    const toast = await this.toastController.create({
      message: 'Tienda no encontrada',
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  private async showErrorMessage() {
    const toast = await this.toastController.create({
      message: 'Error al cargar la tienda. Inténtalo de nuevo más tarde.',
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  filterProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const searchTerm = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) || 
      product.category.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = '/assets/products/default-product.jpg';
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
      message: `${product.name} añadido al carrito`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  goToCart() {
    this.router.navigate(['/tabs/cart']);
  }

  goBack() {
    this.router.navigate(['/tabs/stores']);
  }
} 