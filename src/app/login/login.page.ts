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
import { arrowBackOutline, eyeOffOutline, eyeOutline, logoApple, logoGoogle } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {
    addIcons({
      'logo-google': logoGoogle,
      'logo-apple': logoApple,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'arrow-back-outline': arrowBackOutline
    });
  }



  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.validateForm()) {
      //console.log('Login with:', this.email, this.password);
      // Aquí implementarías la lógica de login
      try {
        const success = await this.authService.login(this.email, this.password);
        if (success) {
          //Redirigir al usuario a la página principal
          this.router.navigate(['/tabs/stores']);
        } else {
          this.showAlert('Error', 'Invalid email or password');
        }
      } catch (error) {
        this.showAlert('Error', 'Login failed. Please try again.');
      }
    }
  }

  private validateForm(): boolean {
    if (!this.email || !this.password) {
      this.showAlert('Error', 'Please fill in all fields');
      return false;
    }
    return true;
  }

  async loginWithGoogle() {
    try {
      const success = await this.authService.loginWithGoogle();
      if (success) {
        this.router.navigate(['/tabs/stores']);
      } else {
        this.showAlert('Error', 'Google login failed');
      }
    } catch (error) {
      this.showAlert('Error', 'Google login failed. Please try again.');
    }
  }

  async loginWithApple() {
    try {
      const success = await this.authService.loginWithApple();
      if (success) {
        this.router.navigate(['/tabs/stores']);
      } else {
        this.showAlert('Error', 'Apple login failed');
      }
    } catch (error) {
      this.showAlert('Error', 'Apple login failed. Please try again.');
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Reset Password',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Enter your email'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send Reset Link',
          handler: async (data) => {
            if (data.email) {
              try {
                // Llamar al método de recuperación de contraseña de Supabase
                const { error } = await this.supabaseService.getClient().auth.resetPasswordForEmail(
                  data.email,
                  {
                    redirectTo: `${window.location.origin}/reset-password`
                  }
                );

                if (error) {
                  this.showAlert('Error', 'Failed to send reset link. Please try again.');
                } else {
                  this.showAlert(
                    'Success',
                    'Password reset link has been sent to your email. Please check your inbox.'
                  );
                }
              } catch (error) {
                console.error('Password reset error:', error);
                this.showAlert('Error', 'An unexpected error occurred. Please try again.');
              }
            } else {
              this.showAlert('Error', 'Please enter a valid email address');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async getData() {
    try {
      const data = await this.supabaseService.getData('your_table_name');
      console.log('Data:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
