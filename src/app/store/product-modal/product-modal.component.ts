import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { addIcons } from 'ionicons';
import { cartOutline, closeOutline } from 'ionicons/icons';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProductModalComponent implements OnInit {
  @Input() product: any;
  quantity: number = 0;
  isInCart: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {
    addIcons({ cart: cartOutline, close: closeOutline });
  }

  ngOnInit() {
    this.checkIfInCart();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async checkIfInCart() {
    const cartItems = this.cartService.getCurrentCartItems();
    const existingItem = cartItems.find(item => item.id === this.product.id);
    if (existingItem) {
      this.isInCart = true;
      this.quantity = existingItem.quantity;
    }
  }

  incrementQuantity() {
    this.quantity++;
  }

  decrementQuantity() {
    if (this.quantity > 0) {
      this.quantity--;
    }
  }

  async addToCart() {
    if (!this.isInCart) {
      // Primera vez que se añade al carrito
      this.quantity = 1;
      await this.cartService.addToCart({
        ...this.product,
        quantity: this.quantity
      });
      this.isInCart = true;
      this.modalCtrl.dismiss({ added: true });
    } else if (this.quantity === 0) {
      await this.notificationService.showWarning('Por favor, selecciona la cantidad que deseas añadir');
      return;
    } else {
      this.updateCartQuantity();
      this.modalCtrl.dismiss({ added: true });
    }
  }

  private async updateCartQuantity() {
    if (this.quantity === 0) {
      await this.cartService.removeFromCart(this.product.id);
      this.isInCart = false;
    } else {
      await this.cartService.updateQuantity(this.product.id, this.quantity);
    }
  }
} 