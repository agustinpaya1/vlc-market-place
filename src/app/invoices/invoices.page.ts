import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-invoices',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Facturas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item-sliding *ngFor="let invoice of invoices">
          <ion-item>
            <ion-label>
              <h2>Factura #{{ invoice.id }}</h2>
              <p>{{ invoice.date | date:'dd/MM/yyyy' }}</p>
              <p>{{ invoice.description }}</p>
            </ion-label>
            <ion-note slot="end" color="primary">
              {{ invoice.total | currency:'EUR' }}
            </ion-note>
          </ion-item>
          
          <ion-item-options side="end">
            <ion-item-option color="primary">
              <ion-icon slot="icon-only" name="download"></ion-icon>
            </ion-item-option>
            <ion-item-option color="secondary">
              <ion-icon slot="icon-only" name="share"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Estado vacío -->
      <div *ngIf="invoices.length === 0" class="empty-state">
        <ion-icon name="receipt"></ion-icon>
        <h2>No hay facturas</h2>
        <p>Aquí aparecerán las facturas de tus compras</p>
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
        color: var(--ion-color-medium);
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

    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;

      h2 {
        font-weight: 600;
        margin-bottom: 4px;
      }

      p {
        color: var(--ion-color-medium);
        font-size: 14px;
        margin: 2px 0;
      }
    }

    ion-note {
      font-weight: 600;
      font-size: 16px;
    }

    ion-item-options {
      ion-item-option {
        --padding-start: 20px;
        --padding-end: 20px;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class InvoicesPage implements OnInit {
  invoices: any[] = []; // Aquí deberías definir una interfaz para las facturas

  constructor() { }

  ngOnInit() {
    // Aquí deberías cargar las facturas del usuario
  }
} 