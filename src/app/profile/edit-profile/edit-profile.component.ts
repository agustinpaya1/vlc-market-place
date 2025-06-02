import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-edit-profile',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Editar Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form (ngSubmit)="onSubmit()" #form="ngForm">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Nombre completo</ion-label>
            <ion-input
              [(ngModel)]="userData.name"
              name="name"
              type="text"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input
              [(ngModel)]="userData.phone"
              name="phone"
              type="tel"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Dirección</ion-label>
            <ion-input
              [(ngModel)]="userData.address"
              name="address"
              type="text"
              required
            ></ion-input>
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          <ion-button expand="block" type="submit" [disabled]="!form.valid">
            Guardar Cambios
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--color-background);
    }

    ion-list {
      background: var(--color-card);
      border-radius: var(--border-radius-medium);
      margin-bottom: var(--spacing-lg);
    }

    ion-item {
      --padding-start: var(--spacing-md);
      --padding-end: var(--spacing-md);
      --padding-top: var(--spacing-sm);
      --padding-bottom: var(--spacing-sm);
      --background: transparent;
      --border-color: var(--border-light);

      ion-label {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      ion-input {
        --color: var(--color-text-primary);
        --placeholder-color: var(--color-text-tertiary);
        font-size: 1rem;
      }
    }

    ion-button {
      margin-top: var(--spacing-lg);
      --border-radius: var(--border-radius-medium);
      height: 48px;
      font-weight: 500;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EditProfileComponent implements OnInit {
  userData: Partial<User> = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.userData = {
        name: user.name,
        phone: user.phone,
        address: user.address
      };
    }
  }

  async onSubmit() {
    try {
      await this.authService.updateUserProfile(this.userData);
      
      const toast = await this.toastController.create({
        message: 'Perfil actualizado correctamente',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/tabs/profile']);
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al actualizar el perfil',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }
} 