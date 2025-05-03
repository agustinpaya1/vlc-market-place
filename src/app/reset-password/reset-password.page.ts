import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonBackButton,
    IonButtons
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  imports: [
    FormsModule,
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonBackButton,
    IonButtons
  ],
  standalone: true
})
export class ResetPasswordPage {
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private alertController: AlertController
  ) {
    // Verificar si hay un hash de recuperación en la URL
    if (!window.location.hash) {
      this.showAlert('Error', 'Invalid password reset link');
      this.router.navigate(['/login']);
    }
  }

  async onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      await this.showAlert('Error', 'Passwords do not match');
      return;
    }

    try {
      // Obtener el hash de la URL (corregido)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (!accessToken) {
        throw new Error('No access token found in URL');
      }

      // Actualizar la contraseña usando el token de acceso
      const { error } = await this.supabaseService.getClient().auth.updateUser({
        password: this.newPassword
      });

      if (error) throw error;

      await this.showAlert('Success', 'Your password has been updated successfully');
      this.router.navigate(['/login']);
    } catch (error: any) {
      await this.showAlert('Error', error.message || 'An error occurred while updating the password');
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}