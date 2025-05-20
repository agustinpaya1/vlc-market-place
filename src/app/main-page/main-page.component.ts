import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  cartOutline,
  ellipsisVerticalOutline,
  removeOutline,
  addOutline,
  trashOutline,
  logInOutline,
  personAddOutline,
  logOutOutline
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
  IonBadge
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { CartService, CartItem } from '../services/cart.service';
import { Router } from '@angular/router';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}

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
    IonBadge
  ]
})
export class MainPageComponent implements OnInit {
  isMenuOpen = false;
  isCartOpen = false;
  isAuthenticated = false;
  currentUser: any = null;
  totalItems = 0;
  cartItems: CartItem[] = [];
  totalPrice = 0;
  products: Product[] = [
    {
      id: '1',
      name: 'Product 1',
      price: 99.99,
      description: 'Description for product 1',
      imageUrl: 'assets/images/product1.jpg'
    },
    {
      id: '2',
      name: 'Product 2',
      price: 149.99,
      description: 'Description for product 2',
      imageUrl: 'assets/images/product2.jpg'
    },
    {
      id: '3',
      name: 'Product 3',
      price: 199.99,
      description: 'Description for product 3',
      imageUrl: 'assets/images/product3.jpg'
    }
  ];

  constructor(
    private toastController: ToastController,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    addIcons({cart,ellipsisVertical,remove,add,trash,logIn,personAdd,logOut,cart:cartOutline,ellipsisVertical:ellipsisVerticalOutline,remove:removeOutline,add:addOutline,trash:trashOutline,logIn:logInOutline,personAdd:personAddOutline,logOut:logOutOutline});
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
    });

    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.updateCartTotals();
    });
  }

  getProductQuantity(productId: string): number {
    const item = this.cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }

  updateProductQuantity(product: Product, change: number): void {
    const currentQuantity = this.getProductQuantity(product.id);
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      this.cartService.removeFromCart(product.id);
    } else {
      this.cartService.updateQuantity(product.id, newQuantity);
    }
  }

  async addToCart(product: Product): Promise<void> {
    await this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl
    });
  }

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  goToCart() {
    this.isCartOpen = false;
    this.router.navigate(['/cart']);
  }

  async onLogout() {
    this.isMenuOpen = false;
    await this.authService.logout();
    this.router.navigate(['/tabs/stores'], { replaceUrl: true });
  }

  onLogin() {
    this.isMenuOpen = false;
    this.router.navigate(['/login']);
  }

  onRegister() {
    this.isMenuOpen = false;
    this.router.navigate(['/register']);
  }

  updateCartTotals() {
    this.totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.id, newQuantity);
    } else {
      this.cartService.removeFromCart(item.id);
    }
  }
}