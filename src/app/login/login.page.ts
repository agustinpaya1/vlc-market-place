import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
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
import { arrowBackOutline, eyeOffOutline, eyeOutline, logoGoogle, logoFacebook, logoApple } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { SettingsService } from '../services/settings.service';
import { Subscription } from 'rxjs';

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
export class LoginPage implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  private themeSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private settingsService: SettingsService,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef
  ) {
    addIcons({logoFacebook,logoApple,logoGoogle,eyeOutline,eyeOffOutline,arrowBackOutline});
  }

  ngOnInit() {
    // Suscribirse a cambios en la configuración de tema
    this.themeSubscription = this.settingsService.getSettings().subscribe(settings => {
      // Forzar detección de cambios cuando cambia el tema
      this.ngZone.run(() => {
        console.log('LoginPage - Theme settings changed:', settings.darkMode ? 'dark' : 'light');
        this.changeDetector.detectChanges();
      });
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.validateForm()) {
      console.log('Login with:', this.email, this.password);
      try {
        this.isLoading = true;
        const success = await this.authService.login(this.email, this.password);
        this.isLoading = false;
        
        if (success) {
          console.log('Login successful, redirecting to stores page');
          
          // Redirigir directamente a la página principal de tiendas 
          // evitando cualquier redirección intermedia a la intro
          this.router.navigate(['/tabs/stores'], { 
            replaceUrl: true,
            skipLocationChange: false
          });
        } else {
          this.showAlert('Error', 'Invalid email or password');
        }
      } catch (error) {
        this.isLoading = false;
        console.error('Login error:', error);
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
        this.router.navigate(['/tabs/stores'], { 
          replaceUrl: true,
          skipLocationChange: false
        });
      } else {
        this.showAlert('Error', 'Google login failed');
      }
    } catch (error) {
      this.showAlert('Error', 'Google login failed. Please try again.');
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Ingresa tu correo electrónico'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar Enlace',
          handler: async (data) => {
            if (data.email) {
              try {
                // Mostrar indicador de carga
                const loading = await this.alertController.create({
                  message: 'Enviando enlace de recuperación...',
                  backdropDismiss: false
                });
                await loading.present();
                
                // Crear una URL de redirección absoluta y correcta
                const origin = window.location.origin;
                const resetUrl = `${origin}/reset-password`;
                
                console.log('Enviando enlace de restablecimiento a:', data.email);
                console.log('URL de redirección completa:', resetUrl);
                
                // Llamar al método de recuperación de contraseña de Supabase con opciones específicas
                const { error } = await this.supabaseService.getClient().auth.resetPasswordForEmail(
                  data.email,
                  {
                    redirectTo: resetUrl
                  }
                );

                // Ocultar indicador de carga
                await loading.dismiss();

                if (error) {
                  console.error('Error al enviar enlace:', error);
                  this.showAlert('Error', 'No se pudo enviar el enlace de recuperación. Por favor intenta nuevamente.');
                } else {
                  console.log('Enlace enviado exitosamente');
                  this.showAlert(
                    'Éxito',
                    'Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada y sigue las instrucciones.'
                  );
                }
              } catch (error) {
                console.error('Error en recuperación de contraseña:', error);
                this.showAlert('Error', 'Ocurrió un error inesperado. Por favor intenta nuevamente.');
              }
            } else {
              this.showAlert('Error', 'Por favor ingresa una dirección de correo válida');
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
