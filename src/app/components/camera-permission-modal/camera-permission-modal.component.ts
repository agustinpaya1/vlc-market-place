import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  cameraOutline, 
  checkmarkCircle, 
  shieldCheckmarkOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-camera-permission-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Permiso de Cámara</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="permission-content ion-text-center">
        <ion-icon name="camera-outline" color="primary" size="large"></ion-icon>
        
        <h2>Necesitamos acceso a tu cámara</h2>
        
        <p>
          Para escanear códigos QR, necesitamos tu permiso para usar la cámara. 
          Esto nos permitirá:
        </p>

        <ion-list lines="none">
          <ion-item>
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label>Escanear códigos QR de pedidos</ion-label>
          </ion-item>
          <ion-item>
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label>Validar pedidos de forma rápida</ion-label>
          </ion-item>
        </ion-list>

        <p class="privacy-note">
          <ion-icon name="shield-checkmark-outline" color="medium"></ion-icon>
          Solo usaremos la cámara cuando lo solicites y nunca guardaremos imágenes.
        </p>

        <ion-button expand="block" (click)="accept()" color="primary">
          Permitir acceso a la cámara
        </ion-button>
        
        <ion-button expand="block" (click)="reject()" fill="clear" color="medium">
          Ahora no
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .permission-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    
    .permission-content ion-icon[name="camera-outline"] {
      font-size: 64px;
      margin: 20px 0;
    }

    .permission-content h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--ion-color-dark);
    }

    .permission-content p {
      color: var(--ion-color-medium);
      margin-bottom: 20px;
      text-align: center;
    }

    .permission-content ion-list {
      width: 100%;
      margin: 20px 0;
      background: transparent;
    }

    .permission-content ion-item {
      --background: transparent;
      --padding-start: 0;
    }

    .permission-content ion-item ion-icon {
      margin-right: 16px;
    }

    .permission-content ion-item ion-label {
      font-size: 16px;
    }

    .permission-content .privacy-note {
      font-size: 14px;
      margin: 20px 0;
      padding: 10px;
      border-radius: 8px;
      background: var(--ion-color-light);
    }

    .permission-content .privacy-note ion-icon {
      vertical-align: middle;
      margin-right: 8px;
    }

    .permission-content ion-button {
      margin: 8px 0;
    }

    .permission-content ion-button[fill="clear"] {
      font-weight: 400;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class CameraPermissionModalComponent {
  constructor(private modalCtrl: ModalController) {
    addIcons({
      cameraOutline,
      checkmarkCircle,
      shieldCheckmarkOutline
    });
  }

  accept() {
    this.modalCtrl.dismiss(true);
  }

  reject() {
    this.modalCtrl.dismiss(false);
  }
} 