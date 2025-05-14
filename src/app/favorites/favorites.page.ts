import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonImg,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { FavoritesService } from '../services/favorites.service';
import { SupabaseService } from '../services/supabase.service';
import { addIcons } from 'ionicons';
import { heart, heartOutline, storefront, location, time, star, arrowForward, medkitOutline } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Store {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  openTime?: string;
  rating?: number;
  categories?: string[];
  hasOffers?: boolean;
  distance?: number;
}

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
      <!-- Loading indicator -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Cargando favoritos...</p>
      </div>

      <!-- Favorite stores grid -->
      <ion-grid *ngIf="!isLoading && favoriteStores.length > 0">
        <ion-row>
          <ion-col size="12" size-md="6" size-lg="4" *ngFor="let store of favoriteStores">
            <ion-card class="store-card" (click)="viewStore(store.id)">
              <img [src]="store.imageUrl" [alt]="store.name" class="store-image" 
                   (error)="handleImageError($event)" loading="lazy">
              
              <button class="favorite-button" (click)="toggleFavorite($event, store.id)" aria-label="Eliminar de favoritos">
                <ion-icon name="heart" class="favorite-icon" style="color: #0288d1 !important;"></ion-icon>
              </button>
              
              <ion-card-header>
                <ion-card-title>{{ store.name }}</ion-card-title>
                <ion-card-subtitle *ngIf="store.categories && store.categories.length > 0">
                  {{ store.categories.join(', ') }}
                </ion-card-subtitle>
              </ion-card-header>
              
              <ion-card-content>
                <div class="store-info">
                  <div class="info-item" *ngIf="store.location">
                    <ion-icon name="location"></ion-icon>
                    <span>{{ store.location }}</span>
                  </div>
                  <div class="info-item" *ngIf="store.openTime">
                    <ion-icon name="time"></ion-icon>
                    <span>{{ store.openTime }}</span>
                  </div>
                  <div class="rating" *ngIf="store.rating">
                    <ion-icon name="star"></ion-icon>
                    <span>{{ store.rating }}</span>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Empty state -->
      <div *ngIf="!isLoading && favoriteStores.length === 0" class="empty-state">
        <ion-icon name="heart-outline"></ion-icon>
        <h2>No tienes tiendas favoritas</h2>
        <p>Añade tus tiendas favoritas para acceder a ellas fácilmente</p>
        
        <div class="button-group">
          <ion-button routerLink="/tabs/stores">
            <ion-icon name="storefront" slot="start"></ion-icon>
            Explorar tiendas
          </ion-button>
          
          <ion-button color="tertiary" (click)="runDiagnostic()">
            <ion-icon name="medkit-outline" slot="start"></ion-icon>
            Diagnosticar conexión
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonImg,
    IonSpinner,
  ]
})
export class FavoritesPage implements OnInit, OnDestroy {
  favoriteStores: Store[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private favoritesService: FavoritesService,
    private supabaseService: SupabaseService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ 
      heart, 
      heartOutline, 
      storefront, 
      location, 
      time, 
      star, 
      arrowForward,
      medkitOutline
    });
  }

  ngOnInit() {
    console.log('[FavoritesPage] Inicializando página de favoritos');
    
    // Primero cargar favoritos con los datos actuales
    this.loadFavoriteStores();
    
    // Luego forzar una sincronización completa con la base de datos
    setTimeout(() => {
      console.log('[FavoritesPage] Solicitando sincronización completa de favoritos');
      this.favoritesService.refreshFavorites().then(() => {
        // Después de sincronizar, volver a cargar los favoritos
        this.loadFavoriteStores();
      });
    }, 1000);
    
    // Suscribirse a cambios en favoritos
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(favoriteIds => {
        if (!this.isLoading) {
          console.log('[FavoritesPage] Detectado cambio en favoritos, recargando');
          this.loadFavoriteStores();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadFavoriteStores() {
    this.isLoading = true;
    
    try {
      // Obtener IDs de favoritos
      const favoriteIds = await this.getFavoriteIds();
      
      if (favoriteIds.length === 0) {
        this.favoriteStores = [];
        this.isLoading = false;
        return;
      }
      
      // Cargar datos de tiendas
      const stores = await this.supabaseService.getStores();
      
      // Filtrar solo las tiendas favoritas
      this.favoriteStores = stores.filter(store => 
        favoriteIds.includes(store.id)
      );
      
    } catch (error) {
      console.error('Error al cargar tiendas favoritas:', error);
      this.favoriteStores = [];
    } finally {
      this.isLoading = false;
    }
  }

  private async getFavoriteIds(): Promise<string[]> {
    return new Promise(resolve => {
      this.favoritesService.getFavorites()
        .pipe(takeUntil(this.destroy$))
        .subscribe(favoriteIds => {
          resolve(favoriteIds);
        });
    });
  }

  viewStore(storeId: string) {
    this.router.navigate(['/tabs/store', storeId]);
  }

  toggleFavorite(event: Event, storeId: string) {
    event.stopPropagation();
    
    // Obtener el nombre de la tienda para un mensaje más descriptivo
    const store = this.favoriteStores.find(s => s.id === storeId);
    const storeName = store ? store.name : 'Tienda';
    
    // Llamar al servicio para alternar favorito
    const isFavorite = this.favoritesService.toggleFavorite(storeId);
    
    // Si se quitó de favoritos, eliminar de la lista en la interfaz
    if (!isFavorite) {
      this.favoriteStores = this.favoriteStores.filter(s => s.id !== storeId);
      
      // Mostrar mensaje de eliminación
      this.toastController.create({
        message: `${storeName} eliminada de favoritos`,
        duration: 2000,
        position: 'bottom',
        color: 'medium'
      }).then(toast => toast.present());
    }
  }

  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/placeholder-store.png';
  }

  // Método para ejecutar diagnóstico
  async runDiagnostic() {
    console.log('Ejecutando diagnóstico de favoritos');
    await this.favoritesService.diagnosticTest();
  }
} 