import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  helpCircleOutline,
  logOutOutline,
  chevronForward,
  settingsOutline,
  informationCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      helpCircleOutline,
      logOutOutline,
      chevronForward,
      settingsOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    // Inicialización simple
  }

  async openHelp() {
    const alert = await this.alertController.create({
      header: 'Ayuda',
      subHeader: 'Preguntas frecuentes',
      message: '¿Cómo realizar un pedido?\nSelecciona productos y completa tu compra en el carrito.\n\n¿Cómo ver mis pedidos?\nVisita la sección de Pedidos en tu perfil.\n\n¿Problemas con la app?\nContacta con soporte@mercau.com',
      buttons: ['Entendido']
    });

    await alert.present();
  }

  async showAppInfo() {
    const alert = await this.alertController.create({
      header: 'Acerca de MercAU',
      subHeader: 'Versión 1.0.0',
      message: 'MercAU: Tu app Artemis para comprar en mercados locales de manera sencilla.\n\nDesarrollada con ♥ por estudiantes de la UPV.\n\n© 2025 - Todos los derechos reservados.',
      buttons: ['Cerrar']
    });

    await alert.present();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: '¿Cerrar sesión?',
      message: '¿Estás seguro de que deseas cerrar la sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          role: 'confirm',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/tabs/stores']);
          }
        }
      ]
    });

    await alert.present();
  }
  
  handleImageError(event: any) {
    // Fallback en caso de error al cargar el logo
    if (event.target) {
      event.target.src = 'assets/logo-placeholder.png';
    }
  }
}
