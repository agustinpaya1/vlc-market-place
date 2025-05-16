import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  receiptOutline, 
  receipt, 
  downloadOutline, 
  shareOutline,
  arrowForwardOutline,
  storefrontOutline,
  homeOutline,
  home
} from 'ionicons/icons';

interface Invoice {
  id: string | number;
  date: string | Date;
  description: string;
  total: number;
  items?: number;
}

@Component({
  selector: 'app-invoices',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Facturas</ion-title>
        <ion-buttons slot="end">
          <img src="https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/logoapp//logo.png" 
               alt="Logo" 
               class="header-logo"
               (error)="handleImageError($event)">
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-background">
        <div class="accent-circle circle-1"></div>
        <div class="accent-circle circle-2"></div>
      </div>
      
      <div class="invoices-container">
        <div class="secure-banner">
          <div class="icon-container">
            <ion-icon name="receipt-outline"></ion-icon>
          </div>
          <div class="secure-text">
            <h3>Tus Facturas</h3>
            <p>Gestiona todas tus compras en un solo lugar</p>
          </div>
        </div>
        
        <div class="invoices-list" *ngIf="invoices.length > 0">
          <div class="invoice-card" *ngFor="let invoice of invoices">
            <div class="card-accent-shape"></div>
            <div class="invoice-card-content">
              <div class="invoice-top">
                <div class="left-section">
                  <span class="invoice-id">Factura #{{ invoice.id }}</span>
                  <span class="invoice-date">{{ invoice.date | date:'dd/MM/yyyy' }}</span>
                </div>
                <ion-badge color="primary">{{ invoice.total | currency:'EUR' }}</ion-badge>
              </div>
              
              <div class="divider"></div>
              
              <div class="invoice-details">
                <div class="invoice-info">
                  <div class="info-item" *ngIf="invoice.description">
                    <ion-icon name="receipt-outline"></ion-icon>
                    <span>{{ invoice.description }}</span>
                  </div>
                  <div class="info-item" *ngIf="invoice.items">
                    <ion-icon name="bag-outline"></ion-icon>
                    <span>{{ invoice.items }} artículos</span>
                  </div>
                </div>
                
                <div class="invoice-actions">
                  <ion-button fill="clear" size="small">
                    <ion-icon name="download-outline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" size="small">
                    <ion-icon name="share-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div *ngIf="invoices.length === 0" class="empty-state">
          <div class="empty-container">
            <ion-icon class="receipt-icon" name="receipt" color="primary"></ion-icon>
            <h2>No hay facturas</h2>
            <p>Aquí aparecerán las facturas de tus compras</p>
            <ion-button routerLink="/tabs/stores" fill="outline" color="primary" class="explore-button">
              <ion-icon name="home" slot="start"></ion-icon>
              <span>Tus facturas más simples que nunca</span>
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

    .invoices-container {
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

    .invoices-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .invoice-card {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      background-color: var(--white);
      margin-bottom: 16px;
      border: 1px solid rgba(2, 163, 150, 0.2);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(2, 163, 150, 0.2);
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

    .invoice-card-content {
      padding: 0;
    }

    .invoice-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: var(--primary-light);
      border-left: 4px solid var(--primary-color);
    }

    .left-section {
      display: flex;
      flex-direction: column;
    }

    .invoice-id {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 15px;
    }

    .invoice-date {
      font-size: 13px;
      color: var(--text-medium);
      margin-top: 4px;
    }

    ion-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .divider {
      height: 1px;
      background: repeating-linear-gradient(
        to right,
        var(--primary-color),
        var(--primary-color) 4px,
        transparent 4px,
        transparent 10px
      );
      margin: 0 16px;
      opacity: 0.4;
    }

    .invoice-details {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      background-color: var(--white);
    }

    .invoice-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .info-item {
      display: flex;
      align-items: center;
      color: var(--text-medium);
      font-size: 14px;
      
      ion-icon {
        color: var(--primary-color);
        margin-right: 8px;
        font-size: 18px;
      }
    }

    .invoice-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      ion-button {
        --color: var(--primary-color);
        --background: var(--primary-light);
        --border-radius: 50%;
        --padding-start: 0;
        --padding-end: 0;
        width: 36px;
        height: 36px;
        margin: 0;
        
        ion-icon {
          font-size: 18px;
        }
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

    .receipt-icon {
      font-size: 70px;
      color: var(--primary-color);
      margin-bottom: 16px;
      background-color: var(--primary-light);
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
export class InvoicesPage implements OnInit {
  invoices: Invoice[] = [];

  constructor() {
    addIcons({
      receiptOutline, 
      receipt, 
      downloadOutline, 
      shareOutline,
      arrowForwardOutline,
      storefrontOutline,
      homeOutline,
      home
    });
  }

  ngOnInit() {
    // Aquí deberías cargar las facturas del usuario
  }

  handleImageError(event: any) {
    // Fallback en caso de error al cargar el logo
    if (event.target) {
      event.target.src = 'assets/logo-placeholder.png';
    }
  }
} 