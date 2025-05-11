import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
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
  chevronBack,
  searchOutline,
  arrowBack
} from 'ionicons/icons';
import { CartService, CartItem } from '../services/cart.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { ProductModalComponent } from './product-modal/product-modal.component';

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
  isLoading = true;
  loadedStoreData = false;
  loadedProductsData = false;
  maxDiscount: number = 0;
  cartItems: CartItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private cartService: CartService,
    private modalCtrl: ModalController
  ) {
    // Cargar solo los iconos necesarios
    addIcons({ 
      star, 
      location, 
      time, 
      pricetag, 
      cart, 
      arrowBack,
      chevronBack,
      searchOutline 
    });
    
    // Subscribe to cart changes
    this.cartService.getCartItems().subscribe((items: CartItem[]) => {
      this.cartItemsCount = this.cartService.getTotalItems();
    });
  }

  async ngOnInit() {
    const storeId = this.route.snapshot.paramMap.get('id');
    if (storeId) {
      // Cargar los datos de la tienda y los productos de forma paralela
      this.loadStoreAndProductsParallel(storeId);
    }

    this.cartService.getCartItems().subscribe((items: CartItem[]) => {
      this.cartItems = items;
      this.updateCartStatus();
    });
  }

  private async loadStoreAndProductsParallel(storeId: string) {
    this.isLoading = true;
    
    // Mostrar indicador de carga inicial mínimo
    const loadingIndicator = await this.loadingController.create({
      message: 'Cargando tienda...',
      spinner: 'circles',
      duration: 5000 // Timeout de seguridad
    });
    await loadingIndicator.present();

    try {
      // Cargar datos en paralelo: tienda, productos y categorías
      const [storeData, productsData, categoriesByStore] = await Promise.all([
        this.supabaseService.getStoreById(storeId).catch(err => {
          console.error('Error al cargar datos de la tienda:', err);
          return null;
        }),
        this.supabaseService.getStoreProducts(storeId).catch(err => {
          console.error('Error al cargar productos:', err);
          return [];
        }),
        this.supabaseService.getAllStoreCategories().catch(err => {
          console.error('Error al cargar categorías:', err);
          return {};
        })
      ]);

      // Procesar datos de la tienda
      if (storeData) {
        console.log('DEBUG storeData:', storeData);
        console.log('DEBUG imageUrl:', storeData.imageUrl);
        this.store = {
          id: storeData.id,
          name: storeData.name,
          description: storeData.description || 'Tienda local con productos de calidad',
          imageUrl: storeData.imageUrl,
          location: storeData.location,
          openTime: storeData.open_time || '9:00 - 20:00',
          rating: storeData.rating || 4.5,
          categories: categoriesByStore && (categoriesByStore as { [key: string]: string[] })[String(storeData.id)] ? (categoriesByStore as { [key: string]: string[] })[String(storeData.id)] : [],
          hasOffers: storeData.has_offers || false,
          distance: storeData.distance || '1.2 km'
        };
        this.loadedStoreData = true;
      } else {
        await this.showStoreNotFoundMessage();
        this.router.navigate(['/tabs/stores']);
      }

      // Procesar datos de productos
      if (productsData && productsData.length > 0) {
        // Calcular el mayor descuento
        let maxDiscount = 0;
        for (const product of productsData) {
          if (product.offerPrice && product.price) {
            const discount = Math.round(100 - (product.offerPrice / product.price) * 100);
            if (discount > maxDiscount) {
              maxDiscount = discount;
            }
          }
        }
        this.maxDiscount = maxDiscount;
        // Procesar los productos en lotes para mejorar el rendimiento
        setTimeout(() => {
          this.products = productsData || [];
          this.filteredProducts = [...this.products];
          this.loadedProductsData = true;
        }, 100);
      } else {
        this.products = [];
        this.filteredProducts = [];
        this.loadedProductsData = true;
        setTimeout(() => this.showNoProductsMessage(), 1000);
        this.maxDiscount = 0;
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      await this.showErrorMessage();
      this.router.navigate(['/tabs/stores']);
    } finally {
      // Ocultar indicador de carga
      loadingIndicator.dismiss();
      this.isLoading = false;
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

  // Función de seguimiento para trackBy en ngFor
  trackProduct(index: number, product: Product) {
    return product.id;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/products/default-product.jpg';
    }
  }

  async addToCart(product: Product) {
    const added = await this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.offerPrice || product.price,
      quantity: 1,
      imageUrl: product.imageUrl
    });

    if (added) {
      const toast = await this.toastController.create({
        message: `${product.name} añadido al carrito`,
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    }
  }

  goToCart() {
    this.router.navigate(['/tabs/cart']);
  }

  goBack() {
    this.router.navigate(['/tabs/stores']);
  }

  async openProductModal(product: Product) {
    const modal = await this.modalCtrl.create({
      component: ProductModalComponent,
      componentProps: {
        product: product
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.added) {
      const toast = await this.toastController.create({
        message: 'Producto añadido al carrito',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    }
  }

  updateCartStatus() {
    // Implementa la lógica para actualizar el estado del carrito aquí
  }
} 