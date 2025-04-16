import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonBadge,
  IonButtons,
  IonText
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import type { Product } from '../services/product.service';
import { addIcons } from 'ionicons';
import { trash, arrowBack, add, remove } from 'ionicons/icons';

interface CartItem {
  productId: number;
  quantity: number;
  product: Product;
}

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonBadge,
    IonButtons,
    IonText
  ]
})
export class CarritoComponent implements OnInit {
  cartItems: CartItem[] = [];

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router
  ) {
    addIcons({ trash, arrowBack, add, remove });
  }

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = Array.from(items.entries())
        .map(([productId, quantity]) => {
          const product = this.productService.getProductById(productId);
          if (product && quantity > 0) {
            return {
              productId,
              quantity,
              product
            };
          }
          return null;
        })
        .filter((item): item is CartItem => item !== null);
    });
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }

  addToCart(productId: number): void {
    this.cartService.addToCart(productId);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  removeAllFromCart(productId: number): void {
    const item = this.cartItems.find(item => item.productId === productId);
    if (item) {
      for (let i = 0; i < item.quantity; i++) {
        this.cartService.removeFromCart(productId);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  proceedToCheckout(): void {
    // Aquí implementaremos la lógica de pago más adelante
    console.log('Proceeding to checkout with items:', this.cartItems);
  }
} 