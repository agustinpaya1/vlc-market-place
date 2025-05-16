import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonSegment,
    IonSegmentButton
} from '@ionic/angular/standalone';
import { AuthService, BusinessProfile } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { 
  eyeOutline, 
  eyeOffOutline, 
  arrowBackOutline, 
  informationCircleOutline, 
  warningOutline,
  personOutline,
  briefcaseOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    IonContent,
    IonButton,
    IonItem,
    IonInput,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonSegment,
    IonSegmentButton
  ],
  standalone: true
})
export class RegisterPage implements OnInit, OnDestroy {
  registerForm: FormGroup;
  showBusinessFields = false;
  showPassword = false;
  private themeSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private settingsService: SettingsService,
    private router: Router,
    private alertController: AlertController,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef
  ) {
    addIcons({
      eyeOutline, 
      eyeOffOutline, 
      arrowBackOutline, 
      informationCircleOutline, 
      warningOutline,
      personOutline,
      briefcaseOutline
    });
    
    this.registerForm = this.formBuilder.group({
      type: ['user', Validators.required],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      businessName: [''],
      taxId: [''],
      address: [''],
      phone: ['']
    });

    this.registerForm.get('type')?.valueChanges.subscribe(value => {
      console.log('Tipo de usuario seleccionado:', value);
      this.showBusinessFields = value === 'business';
      this.updateValidators();
    });
  }

  ngOnInit() {
    // Suscribirse a cambios en la configuración de tema
    this.themeSubscription = this.settingsService.getSettings().subscribe(settings => {
      // Forzar detección de cambios cuando cambia el tema
      this.ngZone.run(() => {
        console.log('RegisterPage - Theme settings changed:', settings.darkMode ? 'dark' : 'light');
        this.changeDetector.detectChanges();
      });
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private updateValidators() {
    const businessFields = ['businessName', 'taxId', 'address', 'phone'];
    
    if (this.showBusinessFields) {
      businessFields.forEach(field => {
        this.registerForm.get(field)?.setValidators([Validators.required]);
      });
    } else {
      businessFields.forEach(field => {
        this.registerForm.get(field)?.clearValidators();
      });
    }
    
    businessFields.forEach(field => {
      this.registerForm.get(field)?.updateValueAndValidity();
    });
  }

  async register() {
    if (this.registerForm.valid) {
      try {
        const formValue = this.registerForm.value;
        let businessData: BusinessProfile | undefined;

        if (formValue.type === 'business') {
          businessData = {
            id: '', // Se asignará automáticamente
            businessName: formValue.businessName,
            taxId: formValue.taxId,
            address: formValue.address,
            phone: formValue.phone
          };
        }

        console.log('Intentando registrar con datos:', {
          fullName: formValue.fullName,
          email: formValue.email,
          type: formValue.type,
          businessData
        });

        const success = await this.authService.register(
          formValue.fullName,
          formValue.email,
          formValue.password,
          formValue.type,
          businessData
        );

        if (success) {
          await this.showSuccessAlert('Registro exitoso. Por favor revisa tu correo electrónico para verificar tu cuenta.');
          this.router.navigate(['/login']);
        } else {
          await this.showErrorAlert('El registro falló. Por favor verifica tus datos e intenta nuevamente.');
        }
      } catch (error: any) {
        console.error('Error detallado en el registro:', error);
        let errorMessage = 'Ha ocurrido un error durante el registro.';
        
        if (error?.message) {
          errorMessage += ' ' + error.message;
        }
        
        await this.showErrorAlert(errorMessage);
      }
    } else {
      await this.showErrorAlert('Por favor, completa todos los campos requeridos correctamente.');
    }
  }

  private async showSuccessAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Registro exitoso',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
