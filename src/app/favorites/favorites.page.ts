import { Component, OnInit, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-favorites',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Mis Tiendas Favoritas</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="runDiagnostic()" *ngIf="!favoriteStores.length">
            <ion-icon name="medkit-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="favoriteProducts.length > 0" class="section-title">
        <h2>Productos favoritos</h2>
      </div>
      <div *ngIf="favoriteProducts.length > 0" class="horizontal-scroll">
        <div class="card-list">
          <div class="mini-card" *ngFor="let item of favoriteProducts">
            <img [src]="item.imageUrl" [alt]="item.name" (error)="handleImageError($event, 'product')">
            <div class="mini-card-header">
              <span class="mini-card-title clickable" (click)="goToStoreFromProduct(item)">{{ item.name }}</span>
              <span class="mini-card-price">
                <ng-container *ngIf="item.hasDiscount; else noDiscount">
                  <span class="final-price">{{ item.finalPrice | currency:'EUR' }}</span>
                  <span class="original-price">{{ item.price | currency:'EUR' }}</span>
                </ng-container>
                <ng-template #noDiscount>
                  {{ item.price | currency:'EUR' }}
                </ng-template>
              </span>
            </div>
            <div class="mini-card-content">
              <p>{{ item.description }}</p>
              <ion-button size="small" (click)="addToCart(item)">
                <ion-icon name="cart" slot="start"></ion-icon>
              </ion-button>
              <ion-button size="small" fill="clear" (click)="toggleFavorite(item, 'product')">
                <ion-icon [name]="isFavorite(item.id, 'product') ? 'heart' : 'heart-outline'" color="danger" slot="start"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="favoriteStores.length > 0" class="section-title">
        <h2>Tiendas favoritas</h2>
      </div>
      <div *ngIf="favoriteStores.length > 0" class="horizontal-scroll">
        <div class="card-list">
          <div class="mini-card" *ngFor="let store of favoriteStores">
            <div class="corner-fav-btn">
              <ion-button size="small" fill="clear" (click)="toggleFavorite(store, 'store')">
                <ion-icon [name]="isFavorite(store.id, 'store') ? 'heart' : 'heart-outline'" color="danger" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
            <img [src]="store.imageUrl" [alt]="store.name" (error)="handleImageError($event, 'store')">
            <div class="mini-card-header">
              <span class="mini-card-title clickable" (click)="goToStore(store.id)">{{ store.name }}</span>
              <span class="mini-card-location">{{ store.location }}</span>
            </div>
            <div class="mini-card-content">
              <p>{{ store.description }}</p>
              <ion-chip color="success" *ngIf="store.hasOffers">Ofertas</ion-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div *ngIf="favoriteProducts.length === 0 && favoriteStores.length === 0" class="empty-state">
        <ion-icon name="heart"></ion-icon>
        <h2>No tienes favoritos</h2>
        <p>Guarda tus productos o tiendas favoritas para encontrarlos fácilmente</p>
        <ion-button routerLink="/tabs/stores">
          Explorar tiendas
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [
    `
    .empty-state {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      ion-icon {
        font-size: 64px;
        color: var(--ion-color-danger);
      }
      h2 {
        margin: 20px 0 10px;
        color: var(--ion-color-dark);
      }
      p {
        color: var(--ion-color-medium);
        margin-bottom: 20px;
      }
    }
    .section-title {
      margin-top: 24px;
      margin-bottom: 8px;
      text-align: left;
    }
    .horizontal-scroll {
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 16px;
      display: block;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #02A396 #e0e0e0;
    }
    .horizontal-scroll::-webkit-scrollbar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 8px;
    }
    .horizontal-scroll::-webkit-scrollbar-thumb {
      background: #02A396;
      border-radius: 8px;
    }
    .card-list {
      white-space: nowrap;
      display: block;
      padding-bottom: 2px;
    }
    .mini-card {
      min-width: 210px;
      max-width: 220px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      display: inline-block;
      vertical-align: top;
      flex-direction: column;
      align-items: flex-start;
      padding: 10px 10px 12px 10px;
      transition: box-shadow 0.2s;
      margin-right: 12px;
      position: relative;
    }
    .mini-card:last-child {
      margin-right: 0;
    }
    .mini-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.13);
    }
    .mini-card img {
      width: 100%;
      height: 90px;
      object-fit: cover;
      border-radius: 10px;
      margin-bottom: 8px;
    }
    .mini-card-header {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 4px;
    }
    .mini-card-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 2px;
      cursor: pointer;
      color: var(--ion-color-primary);
      text-decoration: underline;
      line-height: 1.1;
    }
    .mini-card-price {
      font-size: 0.95rem;
      color: var(--ion-color-medium);
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .final-price {
      color: var(--ion-color-primary);
      font-weight: 600;
      font-size: 1.08em;
    }
    .original-price {
      color: #b0b0b0;
      text-decoration: line-through;
      font-size: 0.95em;
      margin-left: 4px;
    }
    .mini-card-location {
      font-size: 0.95rem;
      color: var(--ion-color-medium);
      margin-bottom: 2px;
    }
    .mini-card-content {
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      font-size: 0.92rem;
      margin-top: 2px;
    }
    .mini-card-content p {
      flex: 1;
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 0.92rem;
      line-height: 1.2;
      max-height: 2.4em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mini-card ion-button {
      --padding-start: 0;
      --padding-end: 0;
      --border-radius: 50%;
      margin: 0 2px;
      min-width: 32px;
      min-height: 32px;
      height: 32px;
      width: 32px;
      font-size: 1.1em;
      display: flex;
      align-items: center;
      justify-content: center;
      --box-shadow: none;
    }
    .mini-card ion-icon {
      font-size: 1.4em;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mini-card ion-chip {
      margin-left: 0;
      margin-right: 4px;
      font-size: 0.85em;
      height: 22px;
    }
    .subtle-toast {
      --background: rgba(40, 40, 40, 0.92);
      --color: #fff;
      --border-radius: 12px;
      --box-shadow: 0 2px 8px rgba(0,0,0,0.10);
      font-size: 0.98em;
      min-width: 120px;
      max-width: 80vw;
      text-align: center;
      margin-top: 8px;
    }
    .corner-fav-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
    }
    .corner-fav-btn ion-button {
      --background: transparent;
      --box-shadow: none;
      --color: inherit;
      min-width: 32px;
      min-height: 32px;
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .corner-fav-btn ion-icon {
      font-size: 1.7em;
      margin: 0;
    }
    `
  ],
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
  ) { }

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

  handleImageError(event: Event, type: 'product' | 'store') {
    const img = event.target as HTMLImageElement;
    img.src = type === 'product' ? 'assets/products/default-product.jpg' : 'assets/stores/default-store.jpg';
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