import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
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
  IonImg
} from '@ionic/angular/standalone';

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
    IonImg
  ]
})
export class MainPageComponent {
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

  constructor(private toastController: ToastController) {}

  async addToCart(product: any): Promise<void> {
    console.log('Product added to cart:', product);

    const toast = await this.toastController.create({
      message: `${product.name} has been added to your cart.`,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}