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
      // Obtener la tienda desde Supabase
      const storeData = await this.supabaseService.getStoreById(storeId);
      // Obtener los productos de la tienda desde Supabase
      const productsData = await this.supabaseService.getStoreProducts(storeId);

      if (storeData) {
        this.store = {
          id: storeData.id,
          name: storeData.name,
          description: storeData.description || 'Tienda local con productos de calidad',
          imageUrl: storeData.imageUrl,
          location: storeData.location,
          openTime: storeData.open_time || '9:00 - 20:00',
          rating: storeData.rating || 4.5,
          categories: storeData.category ? [storeData.category] : ['Especialidad'],
          hasOffers: storeData.has_offers || false,
          distance: storeData.distance || '1.2 km'
        };
        this.products = productsData || [];
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