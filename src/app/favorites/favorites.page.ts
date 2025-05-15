import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { Product } from '../store/product.interface';
import { ToastController } from '@ionic/angular';
import { ViewWillEnter } from '@ionic/angular';

@Component({
  selector: 'app-favorites',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Favoritos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row>
          <ion-col size="12" size-md="6" *ngFor="let item of favorites">
            <ion-card>
              <img [src]="item.imageUrl" [alt]="item.name">
              <ion-card-header>
                <ion-card-title>{{ item.name }}</ion-card-title>
                <ion-card-subtitle>{{ item.price | currency:'EUR' }}</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p>{{ item.description }}</p>
                <ion-button expand="block" (click)="addToCart(item)">
                  Añadir al carrito
                </ion-button>
                <ion-button expand="block" fill="clear" color="danger" (click)="removeFromFavorites(item)">
                  <ion-icon name="heart" slot="start"></ion-icon>
                  Eliminar de favoritos
                </ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Estado vacío -->
      <div *ngIf="favorites.length === 0" class="empty-state">
        <ion-icon name="heart"></ion-icon>
        <h2>No tienes favoritos</h2>
        <p>Guarda tus productos favoritos para encontrarlos fácilmente</p>
        <ion-button routerLink="/tabs/stores">
          Explorar tiendas
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
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

    ion-card {
      margin: 10px;
      border-radius: 15px;
      overflow: hidden;

      img {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }

      ion-card-header {
        padding: 16px;

        ion-card-title {
          font-size: 18px;
          font-weight: 600;
        }

        ion-card-subtitle {
          font-size: 16px;
          color: var(--ion-color-primary);
        }
      }

      ion-card-content {
        padding: 0 16px 16px;

        p {
          margin-bottom: 16px;
          color: var(--ion-color-medium);
        }

        ion-button {
          margin-bottom: 8px;
        }
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class FavoritesPage implements OnInit, ViewWillEnter {
  favorites: Product[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private toastController: ToastController
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
      this.favorites = [];
      return;
    }
    // Obtener los IDs de productos favoritos
    const favs = await this.supabaseService.getFavorites(user.id, 'product');
    const productIds = favs.map((f: any) => f.product_id);
    if (productIds.length === 0) {
      this.favorites = [];
      return;
    }
    // Obtener los productos favoritos por sus IDs
    const { data: products, error } = await this.supabaseService.getClient()
      .from('products')
      .select('*')
      .in('id', productIds);
    if (error) {
      this.favorites = [];
      return;
    }
    // Mapear las imágenes públicas
    this.favorites = (products || []).map((product: any) => ({
      ...product,
      imageUrl: this.supabaseService.getPublicImageUrl(product.image_url)
    }));
  }

  async addToCart(item: Product) {
    // Aquí puedes implementar la lógica para añadir al carrito
    this.toastController.create({
      message: `${item.name} añadido al carrito`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    }).then(toast => toast.present());
  }

  async removeFromFavorites(item: Product) {
    const user = await this.authService.getCurrentUser();
    if (!user) return;
    await this.supabaseService.removeFavorite(user.id, item.id, 'product');
    await this.loadFavorites();
    this.toastController.create({
      message: 'Eliminado de favoritos',
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    }).then(toast => toast.present());
  }
} 