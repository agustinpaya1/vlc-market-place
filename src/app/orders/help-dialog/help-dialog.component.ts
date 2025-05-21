import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-dialog',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ayuda con tus pedidos</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="help-content">
        <div class="help-item">
          <ion-icon name="time-outline" color="warning"></ion-icon>
          <div class="help-text">
            <strong>Pedidos pendientes</strong>
            <p>Pedidos que aún no has recibido</p>
          </div>
        </div>
        
        <div class="help-item">
          <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
          <div class="help-text">
            <strong>Pedidos entregados</strong>
            <p>Pedidos que ya has recibido</p>
          </div>
        </div>
        
        <div class="help-item">
          <ion-icon name="alert-circle-outline" color="tertiary"></ion-icon>
          <div class="help-text">
            <strong>¿Tienes una incidencia?</strong>
            <p>Usa el botón flotante de ayuda</p>
          </div>
        </div>
      </div>
    </ion-content>
    
    <ion-footer>
      <ion-toolbar>
        <ion-button expand="block" (click)="dismiss()" class="ion-margin">
          Entendido
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .help-content {
      .help-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 12px;
        background: rgba(var(--ion-color-light-rgb), 0.5);
        transition: transform 0.2s ease;

        &:last-child {
          margin-bottom: 0;
        }

        ion-icon {
          font-size: 24px;
          margin-top: 2px;
        }

        .help-text {
          flex: 1;

          strong {
            display: block;
            margin-bottom: 4px;
            color: var(--ion-color-dark);
            font-size: 15px;
          }

          p {
            margin: 0;
            color: var(--ion-color-medium);
            font-size: 14px;
          }
        }
      }
    }

    @media (prefers-color-scheme: dark) {
      .help-content {
        .help-item {
          background: rgba(255, 255, 255, 0.05);

          .help-text {
            strong {
              color: var(--ion-color-light);
            }
          }
        }
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HelpDialogComponent {
  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
} 