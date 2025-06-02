import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonThumbnail,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  ToastController
} from '@ionic/angular/standalone';
import { StoreService } from '../../services/store.service';
import { addIcons } from 'ionicons';
import { 
  create, 
  trash, 
  add,
  imageOutline
} from 'ionicons/icons';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  store_id: string;
  stock?: number;
  category?: string;
}

@Component({
  selector: 'app-store-products',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/store-management"></ion-back-button>
        </ion-buttons>
        <ion-title>Productos de la Tienda</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="isLoading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Cargando productos...</p>
      </div>

      <ion-list *ngIf="!isLoading">
        <ion-item-sliding *ngFor="let product of products">
          <ion-item>
            <ion-thumbnail slot="start">
              <img [src]="product.image_url || 'assets/product-placeholder.png'" [alt]="product.name">
            </ion-thumbnail>
            <ion-label>
              <h2>{{ product.name }}</h2>
              <p>{{ product.description || 'Sin descripción' }}</p>
              <p>
                <strong>{{ product.price | currency:'EUR':'symbol':'1.2-2' }}</strong>
                <span *ngIf="product.stock !== undefined"> - Stock: {{ product.stock }}</span>
              </p>
            </ion-label>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option (click)="editProduct(product)" color="primary">
              <ion-icon slot="icon-only" name="create"></ion-icon>
            </ion-item-option>
            <ion-item-option (click)="deleteProduct(product)" color="danger">
              <ion-icon slot="icon-only" name="trash"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>

        <!-- Mensaje cuando no hay productos -->
        <div *ngIf="products.length === 0" class="ion-text-center ion-padding">
          <ion-icon name="cube" style="font-size: 48px; color: var(--ion-color-medium)"></ion-icon>
          <h2>No hay productos</h2>
          <p>Añade productos a tu tienda para empezar a vender</p>
        </div>
      </ion-list>

      <!-- Botón flotante para añadir nuevo producto -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="addProduct()">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --padding: 16px;
    }

    ion-item {
      --padding-start: 0;
      --padding-end: 0;
      margin-bottom: 8px;
      border-radius: 8px;
      --background: var(--ion-color-light);

      ion-thumbnail {
        --size: 80px;
        margin: 8px;
        border-radius: 8px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      ion-label {
        h2 {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }

        p {
          color: var(--ion-color-medium);
          font-size: 14px;
          margin-bottom: 4px;

          strong {
            color: var(--ion-color-dark);
          }
        }
      }
    }

    ion-item-sliding {
      border-radius: 8px;
      margin-bottom: 8px;
      overflow: hidden;
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      h2 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      p {
        color: var(--ion-color-medium);
        font-size: 16px;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonThumbnail,
    IonIcon,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton
  ]
})
export class StoreProductsPage implements OnInit {
  products: Product[] = [];
  isLoading = true;
  storeId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storeService: StoreService,
    private toastController: ToastController
  ) {
    addIcons({
      create,
      trash,
      add,
      imageOutline
    });
  }

  async ngOnInit() {
    this.storeId = this.route.snapshot.paramMap.get('id');
    if (!this.storeId) {
      await this.showToast('ID de tienda no válido', 'danger');
      this.router.navigate(['/tabs/store-management']);
      return;
    }

    await this.loadProducts();
  }

  async loadProducts() {
    try {
      // Aquí implementarías la carga de productos desde el servicio
      // this.products = await this.storeService.getStoreProducts(this.storeId);
      
      // Por ahora usamos datos de ejemplo
      this.products = [
        {
          id: '1',
          name: 'Producto 1',
          description: 'Descripción del producto 1',
          price: 19.99,
          store_id: this.storeId!,
          stock: 10
        },
        {
          id: '2',
          name: 'Producto 2',
          description: 'Descripción del producto 2',
          price: 29.99,
          store_id: this.storeId!,
          stock: 5
        }
      ];
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      await this.showToast('Error al cargar los productos', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  addProduct() {
    // Implementar navegación a la página de creación de producto
    // this.router.navigate(['/tabs/product-create', this.storeId]);
  }

  editProduct(product: Product) {
    // Implementar navegación a la página de edición de producto
    // this.router.navigate(['/tabs/product-edit', product.id]);
  }

  async deleteProduct(product: Product) {
    try {
      // Aquí implementarías la eliminación del producto
      // await this.storeService.deleteProduct(product.id);
      await this.showToast('Producto eliminado correctamente', 'success');
      this.products = this.products.filter(p => p.id !== product.id);
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      await this.showToast('Error al eliminar el producto', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
} 