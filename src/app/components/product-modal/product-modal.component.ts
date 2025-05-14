import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Product } from '../../store/product.interface';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../services/cart.service';
import { addIcons } from 'ionicons';
import { cartOutline, close, arrowBack, add, remove } from 'ionicons/icons';

@Component({
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProductModalComponent implements OnInit {
  @Input() product!: Product;
  quantity: number = 1;
  isInCart: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private cartService: CartService
  ) {
    addIcons({
      cartOutline,
      close,
      arrowBack,
      add,
      remove
    });
  }

  ngOnInit() {
    // Comprobar si el producto ya está en el carrito
    this.cartService.getCartItems().subscribe((cartItems: CartItem[]) => {
      const cartItem = cartItems.find(item => item.id === this.product.id);
      if (cartItem) {
        this.quantity = cartItem.quantity;
        this.isInCart = true;
      }
    });
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/products/default-product.jpg';
    }
  }

  calculateDiscount(price: number, offerPrice: number): string {
    if (!price || !offerPrice) return '0';
    const discount = ((price - offerPrice) / price) * 100;
    return discount.toFixed(0);
  }

  incrementQuantity() {
    if (this.quantity < 10) this.quantity++;
  }

  decrementQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

  async addToCart() {
    await this.cartService.addToCart({
      id: this.product.id,
      name: this.product.name,
      price: this.product.offerPrice || this.product.price,
      quantity: this.quantity,
      imageUrl: this.product.imageUrl
    });
    this.dismiss(true);
  }

  dismiss(added: boolean = false) {
    this.modalCtrl.dismiss({
      added: added
    });
  }
} 