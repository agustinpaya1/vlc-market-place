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
import { arrowBackOutline, eyeOffOutline, eyeOutline, logoApple, logoFacebook, logoGoogle, logoTwitter } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
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
export class Tab1Page {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService
  ) {
    addIcons({
      'logo-google': logoGoogle,
      'logo-facebook': logoFacebook,
      'logo-apple': logoApple,
      'logo-twitter': logoTwitter,
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
          this.router.navigate(['/home']);
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
    //console.log('Google login clicked');
    // Implementar autenticación con Google
    try{
      const success = await this.authService.login('google@example.com', 'google-token');
      if (success) {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      this.showAlert('Error', 'Google login failed. Please try again.');
    }
  }

  async loginWithFacebook() {
    console.log('Facebook login clicked');
    // Implementar autenticación con Facebook
    try{
      const success = await this.authService.login('facebook@example.com', 'facebook-token');
      if (success) {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      this.showAlert('Error', 'Facebook login failed. Please try again.');
    }
  }

  async loginWithApple() {
    console.log('Apple login clicked');
    // Implementar autenticación con Apple
    try{
      const success = await this.authService.login('apple@example.com', 'apple-token');
      if (success) {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      this.showAlert('Error', 'Apple login failed. Please try again.');
    }
  }

  async loginWithTwitter() {
    console.log('Twitter login clicked');
    // Implementar autenticación con Twitter
    try{
      const success = await this.authService.login('twitter@example.com', 'twitter-token');
      if (success) {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      this.showAlert('Error', 'Twitter login failed. Please try again.');
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
          handler: (data) => {
            if (data.email) {
              console.log('Reset password for:', data.email);
              // Implementar lógica de recuperación de contraseña
            }
          }
        }
      ]
    });

    await alert.present();
  }

  goToRegister() {
    this.router.navigate(['/tabs/tab2']);
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
