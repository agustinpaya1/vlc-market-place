import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
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
  IonButtons,
  IonSpinner,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline, arrowBackOutline, lockClosedOutline, checkmarkCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { Subscription } from 'rxjs';

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
    IonButtons,
    IonSpinner,
    IonIcon
  ],
  standalone: true
})
export class ResetPasswordPage implements OnInit, OnDestroy {
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  isValidating: boolean = true;
  isValidResetLink: boolean = false;
  pageState: 'loading' | 'error' | 'form' | 'success' = 'loading';
  errorMessage: string = 'El enlace de restablecimiento es inválido o ha expirado.';
  accessToken: string | null = null;
  private themeSubscription: Subscription | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private settingsService: SettingsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef
  ) {
    addIcons({
      warningOutline,
      arrowBackOutline,
      lockClosedOutline,
      checkmarkCircleOutline,
      informationCircleOutline
    });
  }

  async ngOnInit() {
    console.log('ResetPasswordPage - ngOnInit');
    // Mostrar el estado de carga
    this.pageState = 'loading';
    this.isValidating = true;

    try {
      // Extraer el token de la URL si existe
      await this.extractTokenFromUrl();

      // Verificar si tenemos un token o una sesión activa
      const { data: { session } } = await this.supabaseService.getClient().auth.getSession();

      console.log('ResetPasswordPage - Estado de sesión:', session ? 'Activa' : 'Inactiva');

      if (session || this.accessToken) {
        console.log('ResetPasswordPage - Sesión activa o token encontrado');
        this.pageState = 'form';
        this.isValidResetLink = true;
      } else {
        console.log('ResetPasswordPage - No hay sesión ni token');
        this.pageState = 'error';
        this.isValidResetLink = false;
        this.errorMessage = 'No se encontró un enlace de restablecimiento válido.';
      }
    } catch (error) {
      console.error('ResetPasswordPage - Error en inicialización:', error);
      this.pageState = 'error';
      this.isValidResetLink = false;
      this.errorMessage = 'Ocurrió un error al procesar el enlace de restablecimiento.';
    } finally {
      this.isValidating = false;
      console.log('ResetPasswordPage - Estado final de validación:', {
        pageState: this.pageState,
        isValidResetLink: this.isValidResetLink
      });
    }

    // Suscribirse a cambios en la configuración de tema
    this.themeSubscription = this.settingsService.getSettings().subscribe(settings => {
      // Forzar detección de cambios cuando cambia el tema
      this.ngZone.run(() => {
        console.log('ResetPasswordPage - Theme settings changed:', settings.darkMode ? 'dark' : 'light');
        this.changeDetector.detectChanges();
      });
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private async extractTokenFromUrl() {
    console.log('ResetPasswordPage - extractTokenFromUrl - Analizando URL:', window.location.href);

    // Extraer token del hash si existe
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      this.accessToken = hashParams.get('access_token');
      console.log('Token extraído del hash:', this.accessToken ? 'Encontrado' : 'No encontrado');
    }

    // Extraer token de los parámetros de consulta
    if (!this.accessToken && window.location.search) {
      const queryParams = new URLSearchParams(window.location.search);
      const possibleTokens = ['token', 'access_token', 't'];

      for (const param of possibleTokens) {
        const token = queryParams.get(param);
        if (token) {
          this.accessToken = token;
          console.log(`Token encontrado en parámetro ${param}`);
          break;
        }
      }
    }

    // Verificar si el token se recuperó correctamente
    if (!this.accessToken) {
      console.log('No se encontró ningún token en la URL');
      return;
    }

    // Si encontramos un token, intentar establecer la sesión
    try {
      console.log('Intentando establecer sesión con token:', this.accessToken.substring(0, 10) + '...');

      const { data, error } = await this.supabaseService.getClient().auth.setSession({
        access_token: this.accessToken,
        refresh_token: ''
      });

      if (error) {
        console.error('Error al establecer sesión con token:', error);
        throw error;
      }

      console.log('Sesión establecida correctamente con el token');
    } catch (error) {
      console.error('Error completo al establecer sesión con token:', error);
      throw error;
    }
  }

  async onSubmit() {
    // Validaciones básicas
    if (this.newPassword !== this.confirmPassword) {
      await this.showAlert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (this.newPassword.length < 6) {
      await this.showAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Evitar múltiples clics
    if (this.isLoading) {
      return;
    }

    // Mostrar estado de carga
    this.isLoading = true;

    // Mostrar un loadingController
    const loading = await this.loadingController.create({
      message: 'Actualizando contraseña...',
      backdropDismiss: false
    });
    await loading.present();

    try {
      // Verificar si tenemos una sesión activa
      const { data: { session } } = await this.supabaseService.getClient().auth.getSession();

      if (!session) {
        console.error('No hay una sesión activa para actualizar la contraseña');
        throw new Error('No se encontró una sesión activa. Por favor, utiliza el enlace de restablecimiento de contraseña desde tu correo electrónico.');
      }

      console.log('Sesión activa detectada, procediendo a actualizar la contraseña');

      // Llamar al servicio de Auth para actualizar la contraseña
      const success = await this.authService.resetPassword(this.newPassword);

      // Cerrar el loading controller
      await loading.dismiss();

      if (!success) {
        // Si hay error, mostrar mensaje y cambiar estado
        console.error('Error al actualizar contraseña');
        this.pageState = 'error';
        this.errorMessage = 'No se pudo actualizar la contraseña. Por favor, solicita un nuevo enlace de restablecimiento.';
        await this.showAlert('Error', this.errorMessage);
      } else {
        // Éxito, mostrar estado de éxito
        console.log('Contraseña actualizada correctamente');
        this.pageState = 'success';

        // Redireccionar al login después de un tiempo
        setTimeout(() => {
          // Cerrar sesión
          this.supabaseService.getClient().auth.signOut();

          // Redireccionar
          this.router.navigate(['/login'], { replaceUrl: true });
        }, 2000);
      }
    } catch (error: any) {
      // En caso de excepción, también cerrar el loading controller
      await loading.dismiss();

      console.error('Error detallado en la actualización de contraseña:', error);
      this.pageState = 'error';
      this.errorMessage = error.message || 'Ocurrió un error inesperado. Por favor, solicita un nuevo enlace de restablecimiento.';
      await this.showAlert('Error', this.errorMessage);
    } finally {
      // Siempre marcar como no cargando
      this.isLoading = false;
    }
  }

  navigateToLogin() {
    console.log('ResetPasswordPage - Navegando al login');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
    return alert.onDidDismiss();
  }
}