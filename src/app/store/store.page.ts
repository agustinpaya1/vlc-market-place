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
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private cartService: CartService
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
    const storeId = this.route.snapshot.paramMap.get('id');
    if (storeId) {
      await this.loadStoreData(storeId);
    }
  }

  private async loadStoreData(storeId: string) {
    const loading = await this.loadingController.create({
      message: 'Cargando tienda...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      const storeData = await this.supabaseService.getStoreById(storeId);
      
      if (storeData) {
        const mappedStore = {
          ...storeData,
          location: storeData.location_text || 'Valencia',
          imageUrl: storeData.image_url || 'assets/stores/default-store.jpg',
          products: storeData.products.map((product: any) => ({
            ...product,
            imageUrl: product.image_url || 'assets/products/default-product.jpg'
          }))
        };

        this.store = {
          id: mappedStore.id,
          name: mappedStore.name,
          description: mappedStore.description || 'Tienda local con productos de calidad',
          imageUrl: mappedStore.imageUrl,
          location: mappedStore.location,
          openTime: mappedStore.open_time || '9:00 - 20:00',
          rating: mappedStore.rating || 4.5,
          categories: mappedStore.category ? [mappedStore.category] : ['Especialidad'],
          hasOffers: mappedStore.has_offers || false,
          distance: mappedStore.distance || '1.2 km'
        };

        this.products = mappedStore.products;
        this.filteredProducts = [...this.products];
      } else {
        await this.showStoreNotFoundMessage();
        this.router.navigate(['/tabs/stores']);
      }
    } catch (error) {
      console.error('Error al cargar la tienda:', error);
      await this.showErrorMessage();
      this.router.navigate(['/tabs/stores']);
    } finally {
      this.isLoading = false;
      loading.dismiss();
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
      img.src = 'assets/products/default-product.jpg';
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