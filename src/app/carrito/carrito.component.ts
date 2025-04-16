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
import { addIcons } from 'ionicons';
import { trash, arrowBack, add, remove } from 'ionicons/icons';

interface CartItem {
  productId: number;
  quantity: number;
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
    private cartService: CartService,
    private router: Router
  ) {
    addIcons({ trash, arrowBack, add, remove });
  }

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = Array.from(items.entries()).map(([productId, quantity]) => ({
        productId,
        quantity
      }));
    });
  }

  getProductById(id: number) {
    return this.products.find(product => product.id === id);
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => {
      const product = this.getProductById(item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  }

  addToCart(productId: number): void {
    this.cartService.addToCart(productId);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  getQuantity(productId: number): number {
    return this.cartService.getQuantity(productId);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
} 