import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonLabel,
    FormsModule
  ],
  standalone: true
})
export class RegisterPage {
  fullName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {
    addIcons({
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'arrow-back-outline': arrowBackOutline
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async register() {
    if (this.validateForm()) {
      try {
        const { error } = await this.supabaseService.getClient().auth.signUp({
          email: this.email,
          password: this.password,
          options: {
            data: {
              full_name: this.fullName
            }
          }
        });

        if (error) throw error;

        await this.showAlert('Success', 'Registration successful. Please check your email to verify your account.');
        this.router.navigate(['/login']);
      } catch (error: any) {
        this.showAlert('Error', error.message || 'An error occurred during registration');
      }
    }
  }

  private validateForm(): boolean {
    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) {
      this.showAlert('Error', 'Please fill in all fields');
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.showAlert('Error', 'Passwords do not match');
      return false;
    }
    if (this.password.length < 6) {
      this.showAlert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    return true;
  }

  goToLogin() {
    this.router.navigate(['/login']);
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
