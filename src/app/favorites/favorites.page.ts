import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

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
export class FavoritesPage implements OnInit {
  favorites: any[] = []; // Aquí deberías definir una interfaz para los productos favoritos

  constructor() { }

  ngOnInit() {
    // Aquí deberías cargar los favoritos del usuario
  }

  addToCart(item: any) {
    // Implementar lógica para añadir al carrito
  }

  removeFromFavorites(item: any) {
    // Implementar lógica para eliminar de favoritos
  }
} 