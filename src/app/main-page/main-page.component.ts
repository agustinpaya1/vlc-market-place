import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  ellipsisVertical,
  personCircle,
  logIn,
  personAdd,
  logOut,
  cart
} from 'ionicons/icons';
import { 
  IonContent, 
  IonButton, 
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonImg,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonTitle,
  IonAvatar
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonImg,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonTitle,
    IonAvatar
  ]
})
export class MainPageComponent {
  isMenuOpen = false;
  isAuthenticated = false;
  currentUser: any = null;
  products = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description of Product 1',
      price: 100,
      imageUrl: 'assets/images/product1.jpg'
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description of Product 2',
      price: 0,
      imageUrl: 'assets/images/product2.jpg'
    },
    {
      id: 3,
      name: 'Product 3',
      description: 'Description of Product 3',
      price: 1000,
      imageUrl: 'assets/images/product3.jpg'
    }
  ];

  constructor(
    private toastController: ToastController,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ 
      ellipsisVertical,
      personCircle,
      logIn,
      personAdd,
      logOut,
      cart
    });
    // Suscribirse al estado de autenticación
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
    });
  }

  async addToCart(product: any): Promise<void> {
    console.log('Product added to cart:', product);

    const toast = await this.toastController.create({
      message: `${product.name} has been added to your cart.`,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  onLogin() {
    this.isMenuOpen = false;
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 100);
  }

  onRegister() {
    this.isMenuOpen = false;
    setTimeout(() => {
      this.router.navigate(['/register']);
    }, 100);
  }

  async onLogout() {
    this.isMenuOpen = false;
    try {
      await this.authService.logout();
      const toast = await this.toastController.create({
        message: 'Sesión cerrada correctamente',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al cerrar sesión',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    }
  }
}