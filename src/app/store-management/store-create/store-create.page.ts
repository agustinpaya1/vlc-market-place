import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  ToastController
} from '@ionic/angular/standalone';
import { StoreService, Store } from '../../services/store.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-store-create',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/store-management"></ion-back-button>
        </ion-buttons>
        <ion-title>Crear Nueva Tienda</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form (ngSubmit)="createStore()">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Nombre *</ion-label>
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
          <ion-button expand="block" type="submit" [disabled]="!store.name">
            Crear Tienda
          </ion-button>
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
      margin-bottom: 16px;
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
    IonBackButton
  ]
})
export class StoreCreatePage {
  store: Partial<Store> = {};

  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private router: Router,
    private toastController: ToastController
  ) {}

  async createStore() {
    if (!this.store.name) {
      await this.showToast('El nombre de la tienda es obligatorio', 'danger');
      return;
    }

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const newStore: Partial<Store> = {
        ...this.store,
        owner_id: user.id,
        created_at: new Date().toISOString()
      };

      // Aquí implementarías la lógica para crear la tienda
      // await this.storeService.createStore(newStore);
      
      await this.showToast('Tienda creada correctamente', 'success');
      this.router.navigate(['/tabs/store-management']);
    } catch (error) {
      console.error('Error al crear la tienda:', error);
      await this.showToast('Error al crear la tienda', 'danger');
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