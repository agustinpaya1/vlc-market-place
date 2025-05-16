import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { Product } from '../store/product.interface';
import { ToastController } from '@ionic/angular';
import { ViewWillEnter } from '@ionic/angular';
import { Store } from '../interfaces/store.interface';
import { CartService } from '../services/cart.service';
import { addIcons } from 'ionicons';
import { 
  heartOutline, 
  heart, 
  cartOutline, 
  storefront, 
  storefrontOutline,
  lockClosedOutline,
  arrowForwardOutline,
  homeOutline,
  home
} from 'ionicons/icons';

@Component({
  selector: 'app-favorites',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Favoritos</ion-title>
        <ion-buttons slot="end">
          <img src="https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/logoapp//logo.png" 
               alt="Logo" 
               class="header-logo"
               (error)="handleImageError($event, 'logo')">
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-background">
        <div class="accent-circle circle-1"></div>
        <div class="accent-circle circle-2"></div>
      </div>
      
      <div class="favorites-container">
        <div class="secure-banner">
          <div class="icon-container">
            <ion-icon name="heart"></ion-icon>
          </div>
          <div class="secure-text">
            <h3>Tus Favoritos</h3>
            <p>Encuentra rápidamente lo que más te gusta</p>
          </div>
        </div>
        
        <!-- Productos Favoritos -->
        <div *ngIf="favoriteProducts.length > 0" class="section-container">
          <div class="section-header">
            <h2>Productos favoritos</h2>
          </div>
          
          <div class="cards-grid">
            <div class="product-card" *ngFor="let item of favoriteProducts">
              <div class="card-accent-shape"></div>
              <div class="product-image">
                <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event, 'product')">
              </div>
              <div class="product-details">
                <h3 class="product-title clickable" (click)="goToStoreFromProduct(item)">{{ item.name }}</h3>
                <div class="price-container">
                  <ng-container *ngIf="item.hasDiscount; else noDiscount">
                    <span class="final-price">{{ item.finalPrice | currency:'EUR' }}</span>
                    <span class="original-price">{{ item.price | currency:'EUR' }}</span>
                  </ng-container>
                  <ng-template #noDiscount>
                    <span class="final-price">{{ item.price | currency:'EUR' }}</span>
                  </ng-template>
                </div>
                <p class="product-description">{{ item.description }}</p>
                <div class="product-actions">
                  <ion-button (click)="addToCart(item)" fill="solid" color="primary" class="cart-btn">
                    <ion-icon name="cart-outline" slot="start"></ion-icon>
                    <span>Añadir</span>
                  </ion-button>
                  <ion-button (click)="toggleFavorite(item, 'product')" fill="clear" color="danger" class="fav-btn">
                    <ion-icon [name]="isFavorite(item.id, 'product') ? 'heart' : 'heart-outline'"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tiendas Favoritas -->
        <div *ngIf="favoriteStores.length > 0" class="section-container">
          <div class="section-header">
            <h2>Tiendas favoritas</h2>
          </div>
          
          <div class="cards-grid">
            <div class="store-card" *ngFor="let store of favoriteStores">
              <div class="card-accent-shape"></div>
              <div class="store-image">
                <img [src]="store.imageUrl" [alt]="store.name" (error)="handleImageError($event, 'store')">
              </div>
              <div class="store-details">
                <h3 class="store-title clickable" (click)="goToStore(store.id)">{{ store.name }}</h3>
                <div class="store-location">
                  <ion-icon name="storefront-outline"></ion-icon>
                  <span>{{ store.location }}</span>
                </div>
                <p class="store-description">{{ store.description }}</p>
                <div class="store-actions">
                  <ion-button routerLink="/tabs/store/{{store.id}}" fill="solid" color="primary" class="view-btn">
                    <span>Ver tienda</span>
                    <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
                  </ion-button>
                  <ion-button (click)="toggleFavorite(store, 'store')" fill="clear" color="danger" class="fav-btn">
                    <ion-icon [name]="isFavorite(store.id, 'store') ? 'heart' : 'heart-outline'"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div *ngIf="favoriteProducts.length === 0 && favoriteStores.length === 0" class="empty-state">
          <div class="empty-container">
            <ion-icon class="heart-icon" name="heart" color="danger"></ion-icon>
            <h2>No tienes favoritos</h2>
            <p>Guarda tus productos o tiendas favoritas para encontrarlos fácilmente</p>
            <ion-button routerLink="/tabs/stores" fill="outline" color="primary" class="explore-button">
              <ion-icon name="home" slot="start"></ion-icon>
              <span>Descubre tus favoritas</span>
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --primary-color: #02A396;
      --primary-light: rgba(2, 163, 150, 0.15);
      --primary-medium: rgba(2, 163, 150, 0.3);
      --primary-dark: #028090;
      --text-dark: #2A3B47;
      --text-medium: #546E7A;
      --text-light: #B0BEC5;
      --accent-green: #4CAF50;
      --white: #FFFFFF;
      --light-bg: #F5F7FA;
    }

    ion-header {
      position: relative;
    }

    ion-toolbar {
      --background: var(--primary-color);
      --color: var(--white);
    }
    
    ion-title {
      font-weight: 600;
    }

    .header-logo {
      width: 36px;
      height: 36px;
      margin-right: 12px;
      border-radius: 50%;
      background-color: var(--white);
      padding: 2px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .page-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--light-bg);
      z-index: -1;
      overflow: hidden;
    }

    .accent-circle {
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      opacity: 0.2;
    }

    .circle-1 {
      width: 250px;
      height: 250px;
      top: -50px;
      left: -70px;
    }

    .circle-2 {
      width: 350px;
      height: 350px;
      bottom: -100px;
      right: -100px;
    }

    ion-content {
      --background: transparent;
    }

    .favorites-container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }

    .secure-banner {
      display: flex;
      align-items: center;
      background: linear-gradient(to right, var(--primary-color), var(--primary-dark));
      padding: 15px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(2, 163, 150, 0.3);
    }

    .icon-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      margin-right: 14px;
      
      ion-icon {
        color: var(--white);
        font-size: 22px;
      }
    }

    .secure-text {
      color: var(--white);
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
      }
    }

    .section-container {
      margin-bottom: 24px;
    }

    .section-header {
      margin-bottom: 12px;
      
      h2 {
        color: var(--text-dark);
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .product-card, .store-card {
      position: relative;
      background: var(--white);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid rgba(2, 163, 150, 0.2);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(2, 163, 150, 0.2);
      }
    }

    .card-accent-shape {
      position: absolute;
      top: 0;
      right: 0;
      width: 40px;
      height: 40px;
      background-color: var(--primary-color);
      opacity: 0.2;
      clip-path: polygon(100% 0, 0 0, 100% 100%);
    }

    .product-image, .store-image {
      height: 140px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .product-details, .store-details {
      padding: 16px;
    }

    .product-title, .store-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-dark);
      
      &.clickable {
        cursor: pointer;
        color: var(--primary-color);
        
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .price-container {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }

    .final-price {
      color: var(--primary-color);
      font-weight: 700;
      font-size: 16px;
    }

    .original-price {
      text-decoration: line-through;
      color: var(--text-medium);
      font-size: 13px;
    }

    .store-location {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      color: var(--text-medium);
      font-size: 14px;
      
      ion-icon {
        color: var(--primary-color);
        margin-right: 6px;
      }
    }

    .product-description, .store-description {
      color: var(--text-medium);
      font-size: 14px;
      margin: 0 0 12px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.3;
      max-height: 2.6em;
    }

    .product-actions, .store-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    ion-button.cart-btn, ion-button.view-btn {
      --background: var(--primary-color);
      --border-radius: 20px;
      --padding-start: 12px;
      --padding-end: 12px;
      font-size: 14px;
      font-weight: 500;
      --box-shadow: 0 3px 8px rgba(2, 163, 150, 0.2);
    }

    ion-button.fav-btn {
      --color: #f44336;
      --box-shadow: none;
      --border-radius: 50%;
      --padding-start: 0;
      --padding-end: 0;
      width: 36px;
      height: 36px;
      margin: 0;
      
      ion-icon {
        font-size: 22px;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0;
      margin-top: 30px;
    }

    .empty-container {
      position: relative;
      padding: 30px 20px;
      background: linear-gradient(135deg, var(--white) 0%, var(--light-bg) 100%);
      border-radius: 16px;
      width: 100%;
      max-width: 350px;
      margin: 0 auto;
      box-shadow: 0 10px 30px rgba(2, 163, 150, 0.2);
      border: 1px solid rgba(2, 163, 150, 0.2);
    }

    .heart-icon {
      font-size: 70px;
      color: var(--ion-color-danger);
      margin-bottom: 16px;
      background-color: rgba(244, 67, 54, 0.15);
      padding: 18px;
      border-radius: 50%;
    }

    .empty-state h2 {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 8px;
    }

    .empty-state p {
      color: var(--text-medium);
      font-size: 15px;
      margin-bottom: 24px;
      max-width: 250px;
    }

    .empty-state ion-button.explore-button {
      --color: var(--primary-color);
      --border-color: var(--primary-color);
      --border-width: 2px;
      --border-radius: 25px;
      --background: transparent;
      --background-hover: rgba(2, 163, 150, 0.08);
      --box-shadow: none;
      font-weight: 600;
      font-size: 15px;
      height: 48px;
      --padding-start: 20px;
      --padding-end: 20px;
      margin-top: 10px;
      text-transform: none;
      
      ion-icon {
        margin-right: 8px;
        font-size: 18px;
        color: var(--primary-color);
      }
      
      &:hover {
        --background: rgba(2, 163, 150, 0.08);
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class FavoritesPage implements OnInit, ViewWillEnter {
  favoriteProducts: Product[] = [];
  favoriteStores: Store[] = [];
  private favoriteProductIds: string[] = [];
  private favoriteStoreIds: string[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private toastController: ToastController,
    private router: Router,
    private cartService: CartService
  ) {
    addIcons({
      heartOutline, 
      heart, 
      cartOutline, 
      storefront, 
      storefrontOutline,
      lockClosedOutline,
      arrowForwardOutline,
      homeOutline,
      home
    });
  }

  async ngOnInit() {
    await this.loadFavorites();
  }

  async ionViewWillEnter() {
    await this.loadFavorites();
  }

  private async loadFavorites() {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.favoriteProducts = [];
      this.favoriteStores = [];
      this.favoriteProductIds = [];
      this.favoriteStoreIds = [];
      return;
    }
    // Productos favoritos
    const favProducts = await this.supabaseService.getFavorites(user.id, 'product');
    this.favoriteProductIds = favProducts.map((f: any) => f.product_id);
    if (this.favoriteProductIds.length > 0) {
      const { data: products, error } = await this.supabaseService.getClient()
        .from('products')
        .select('*')
        .in('id', this.favoriteProductIds);
      this.favoriteProducts = (products || []).map((product: any) => {
        let finalPrice = product.price;
        let hasDiscount = false;
        let discount = product.discount || 0;
        if (discount > 0 && discount <= 100) {
          finalPrice = +(product.price * (1 - discount / 100)).toFixed(2);
          hasDiscount = true;
        }
        return {
          ...product,
          imageUrl: this.getImageUrl(product.image_url, 'product'),
          store_id: product.store_id,
          finalPrice,
          hasDiscount,
          discount
        };
      });
    } else {
      this.favoriteProducts = [];
    }
    // Tiendas favoritas
    const favStores = await this.supabaseService.getFavorites(user.id, 'store');
    this.favoriteStoreIds = favStores.map((f: any) => f.store_id);
    if (this.favoriteStoreIds.length > 0) {
      const { data: stores, error } = await this.supabaseService.getClient()
        .from('stores')
        .select('*')
        .in('id', this.favoriteStoreIds);
      this.favoriteStores = (stores || []).map((store: any) => ({
        ...store,
        imageUrl: this.getImageUrl(store.image_url, 'store'),
        categories: store.categories || [],
        hasOffers: store.has_offers || false,
        rating: store.rating || 4.5,
        location: store.location_text || store.location || 'Valencia',
        openTime: store.open_time || '9:00 - 20:00',
        distance: store.distance || ''
      }));
    } else {
      this.favoriteStores = [];
    }
  }

  getImageUrl(path: string, type: 'product' | 'store'): string {
    if (!path) {
      return type === 'product' ? 'assets/products/default-product.jpg' : 'assets/stores/default-store.jpg';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Usar buckets correctos: 'productos' y 'fotostiendas'
    const bucket = type === 'product' ? 'productos' : 'fotostiendas';
    try {
      return this.supabaseService.getClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
    } catch {
      return type === 'product' ? 'assets/products/default-product.jpg' : 'assets/stores/default-store.jpg';
    }
  }

  handleImageError(event: Event, type: 'product' | 'store' | 'logo') {
    const img = event.target as HTMLImageElement;
    if (type === 'logo') {
      img.src = 'assets/logo-placeholder.png';
    } else {
      img.src = type === 'product' ? 'assets/products/default-product.jpg' : 'assets/stores/default-store.jpg';
    }
    img.onerror = null;
  }

  goToStore(storeId: string) {
    this.router.navigate(['/tabs/store', storeId]);
  }

  isFavorite(id: string, type: 'product' | 'store'): boolean {
    return type === 'product'
      ? this.favoriteProductIds.includes(id)
      : this.favoriteStoreIds.includes(id);
  }

  async toggleFavorite(item: Product | Store, type: 'product' | 'store') {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.toastController.create({
        message: 'Debes de estar registrado para añadir a favoritos',
        duration: 1200,
        position: 'top',
        color: 'success',
        cssClass: 'subtle-toast'
      }).then(toast => toast.present());
      return;
    }
    const id = item.id;
    if (this.isFavorite(id, type)) {
      await this.supabaseService.removeFavorite(user.id, id, type);
      if (type === 'product') {
        this.favoriteProductIds = this.favoriteProductIds.filter(pid => pid !== id);
        this.favoriteProducts = this.favoriteProducts.filter(p => p.id !== id);
      } else {
        this.favoriteStoreIds = this.favoriteStoreIds.filter(sid => sid !== id);
        this.favoriteStores = this.favoriteStores.filter(s => s.id !== id);
      }
      this.toastController.create({
        message: 'Eliminado de favoritos',
        duration: 1200,
        position: 'top',
        color: 'success',
        cssClass: 'subtle-toast'
      }).then(toast => toast.present());
    } else {
      await this.supabaseService.addFavorite(user.id, id, type);
      if (type === 'product') {
        if (!this.favoriteProductIds.includes(id)) this.favoriteProductIds.push(id);
        if (!this.favoriteProducts.some(p => p.id === id)) this.favoriteProducts.push(item as Product);
      } else {
        if (!this.favoriteStoreIds.includes(id)) this.favoriteStoreIds.push(id);
        if (!this.favoriteStores.some(s => s.id === id)) this.favoriteStores.push(item as Store);
      }
      this.toastController.create({
        message: 'Añadido a favoritos',
        duration: 1200,
        position: 'top',
        color: 'success',
        cssClass: 'subtle-toast'
      }).then(toast => toast.present());
    }
  }

  async addToCart(item: Product) {
    // Añade el producto al carrito usando el servicio
    await this.cartService.addToCart({
      id: item.id,
      name: item.name,
      price: item.finalPrice || item.price,
      quantity: 1,
      imageUrl: item.imageUrl
    });
    // El toast lo muestra el CartService (NotificationService), no aquí
  }

  goToStoreFromProduct(product: Product) {
    // Si el producto tiene storeId, úsalo; si no, intenta buscarlo en favoriteStores
    const storeId = (product as any).storeId || (product as any).store_id;
    if (storeId) {
      this.goToStore(storeId);
    } else {
      // Buscar en favoriteStores por coincidencia de nombre de tienda si existiera relación
      // (esto es un fallback, lo ideal es que el producto tenga el storeId)
      // Si no, no navega
    }
  }
} 