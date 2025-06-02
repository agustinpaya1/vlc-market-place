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
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton,
  ToastController,
  IonSpinner
} from '@ionic/angular/standalone';
import { StoreService, Store } from '../../services/store.service';

@Component({
  selector: 'app-store-edit',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/store-management"></ion-back-button>
        </ion-buttons>
        <ion-title>Editar Tienda</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div *ngIf="isLoading" class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Cargando datos de la tienda...</p>
      </div>

      <form *ngIf="!isLoading" (ngSubmit)="saveStore()">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input [(ngModel)]="store.name" name="name" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Descripción</ion-label>
            <ion-textarea
              [(ngModel)]="store.description"
              name="description"
              rows="4"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Dirección</ion-label>
            <ion-input [(ngModel)]="store.address" name="address"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Categoría</ion-label>
            <ion-input [(ngModel)]="store.category" name="category"></ion-input>
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          <ion-button expand="block" type="submit">Guardar Cambios</ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --padding: 16px;
    }
    
    ion-item {
      --padding-start: 0;
      --padding-end: 0;
      --inner-padding-end: 0;
    }
    
    ion-label {
      margin-bottom: 8px;
    }
    
    ion-input, ion-textarea {
      --background: var(--ion-color-light);
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 16px;
      --padding-bottom: 16px;
      border-radius: 8px;
    }
    
    ion-button {
      margin-top: 24px;
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
    IonInput,
    IonTextarea,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSpinner
  ]
})
export class StoreEditPage implements OnInit {
  store: Partial<Store> = {};
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storeService: StoreService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    const storeId = this.route.snapshot.paramMap.get('id');
    if (!storeId) {
      await this.showToast('ID de tienda no válido', 'danger');
      this.router.navigate(['/tabs/store-management']);
      return;
    }

    try {
      const store = await this.storeService.getStoreById(storeId);
      if (store) {
        this.store = store;
      } else {
        throw new Error('Tienda no encontrada');
      }
    } catch (error) {
      console.error('Error al cargar la tienda:', error);
      await this.showToast('Error al cargar los datos de la tienda', 'danger');
      this.router.navigate(['/tabs/store-management']);
    } finally {
      this.isLoading = false;
    }
  }

  async saveStore() {
    try {
      // Aquí implementarías la lógica para guardar los cambios
      // await this.storeService.updateStore(this.store);
      await this.showToast('Cambios guardados correctamente', 'success');
      this.router.navigate(['/tabs/store-management']);
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      await this.showToast('Error al guardar los cambios', 'danger');
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