import { AuthService } from '../services/auth.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { 
  IonContent, 
  IonButton, 
  IonIcon, 
  IonItem, 
  IonInput, 
  IonLabel,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonLabel,
    IonBackButton,
    IonButtons,
    FormsModule
  ],
  standalone: true
})
export class Tab2Page {
  fullName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService
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
      console.log('Register:', this.fullName, this.email);
      // Implementar lógica de registro aquí
      try{
        const success = await this.authService.register(
          this.fullName,
          this.email,
          this.password
        );
        if (success) {
          await this.showAlert('Success', 'Registration successful');
          this.router.navigate(['/home']);
        } else {
          this.showAlert('Error', 'Registration failed');
        }
      } catch (error) {
        this.showAlert('Error', 'An error has occurred. Please try again.');
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
    this.router.navigate(['/tabs/tab1']);
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
