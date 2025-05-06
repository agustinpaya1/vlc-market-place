import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonButtons,
  IonCardSubtitle,
  IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { CartService, CartItem } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { addIcons } from 'ionicons';
import { trash, arrowBack, add, remove, checkmarkCircle, home } from 'ionicons/icons';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonButtons,
    IonCardSubtitle,
    IonSpinner,
    PaymentModalComponent
  ]
})
export class CarritoComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalItems = 0;
  totalPrice = 0;
  paymentSuccess = false;
  paymentId = '';

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router,
    private modalCtrl: ModalController
  ) {
    addIcons({ trash, arrowBack, add, remove, checkmarkCircle, home });
  }

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.totalItems = this.cartService.getTotalItems();
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.id, newQuantity);
    }
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  async proceedToCheckout(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: PaymentModalComponent,
      componentProps: {
        cartItems: this.cartItems,
        totalAmount: this.totalPrice
      },
      cssClass: 'payment-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'success' && data?.success) {
      this.paymentSuccess = true;
      this.paymentId = data.paymentId;
      
      // Clear the cart after successful payment
      this.cartService.clearCart();
      
      // Use a timer to show success message for 3 seconds before redirecting
      console.log('Payment successful, will redirect to stores in 3 seconds');
      
      setTimeout(() => {
        console.log('Redirecting to stores now...');
        // Use the correct path according to your router configuration
        this.router.navigateByUrl('/tabs/stores').then(() => {
          console.log('Navigation complete');
        }).catch(err => {
          console.error('Navigation error:', err);
        });
      }, 3000); // Increased to 3 seconds for better user experience
    }
  }
} 