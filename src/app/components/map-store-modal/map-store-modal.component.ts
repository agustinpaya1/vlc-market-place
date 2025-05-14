import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Store } from '../../interfaces/store.interface';
import { Product } from '../../store/product.interface';
import { CartService } from '../../services/cart.service';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import { 
  star, 
  location, 
  time, 
  pricetag, 
  cart,
  close,
  searchOutline,
  heartOutline,
  share
} from 'ionicons/icons';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-map-store-modal',
  templateUrl: './map-store-modal.component.html',
  styleUrls: ['./map-store-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MapStoreModalComponent implements OnInit {
  @Input() store!: Store;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  cartItemsCount = 0;
  isLoading = true;
  maxDiscount: number = 0;

  constructor(
    private modalCtrl: ModalController,
    private supabaseService: SupabaseService,
    private cartService: CartService,
    private toastController: ToastController
  ) {
    addIcons({ 
      star, 
      location, 
      time, 
      pricetag, 
      cart,
      close,
      searchOutline,
      heartOutline,
      share
    });

    this.cartService.getCartItems().subscribe(() => {
      this.cartItemsCount = this.cartService.getTotalItems();
    });
  }

  async ngOnInit() {
    if (this.store?.id) {
      await this.loadStoreProducts(this.store.id);
    }
  }

  private async loadStoreProducts(storeId: string) {
    try {
      const productsData = await this.supabaseService.getStoreProducts(storeId);
      
      if (productsData && productsData.length > 0) {
        let maxDiscount = 0;
        for (const product of productsData) {
          if (product.offerPrice && product.price) {
            const discount = Math.round(100 - (product.offerPrice / product.price) * 100);
            maxDiscount = Math.max(maxDiscount, discount);
          }
        }
        this.maxDiscount = maxDiscount;
        this.products = productsData;
        this.filteredProducts = [...this.products];
      } else {
        this.products = [];
        this.filteredProducts = [];
        this.showNoProductsMessage();
      }
    } catch (error) {
      console.error('Error loading products:', error);
      this.showErrorMessage();
    } finally {
      this.isLoading = false;
    }
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

  async openProductModal(product: Product) {
    const modal = await this.modalCtrl.create({
      component: ProductModalComponent,
      componentProps: {
        product: product
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8,
      cssClass: 'product-modal',
      showBackdrop: true,
      backdropDismiss: true,
      handle: true
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

  private async showNoProductsMessage() {
    const toast = await this.toastController.create({
      message: 'Esta tienda no tiene productos disponibles en este momento',
      duration: 3000,
      position: 'bottom',
      color: 'warning'
    });
    await toast.present();
  }

  private async showErrorMessage() {
    const toast = await this.toastController.create({
      message: 'Error al cargar los productos. Inténtalo de nuevo más tarde.',
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  toggleFavorite() {
    this.toastController.create({
      message: 'Tienda añadida a favoritos',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    }).then(toast => toast.present());
  }

  shareStore() {
    if (navigator.share) {
      navigator.share({
        title: this.store?.name,
        text: this.store?.description,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      this.toastController.create({
        message: 'Compartir no está disponible en este dispositivo',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      }).then(toast => toast.present());
    }
  }
}
