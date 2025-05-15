import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart.service';
import { addIcons } from 'ionicons';
import { cartOutline, close, arrowBack, add, remove } from 'ionicons/icons';
import { NotificationService } from '../../services/notification.service';
import { take } from 'rxjs/operators';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

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
  isFavorite: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private cartService: CartService,
    private notificationService: NotificationService,
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    addIcons({
      cartOutline,
      close,
      arrowBack,
      add,
      remove
    });
  }

  async ngOnInit() {
    // Comprobar si el producto ya está en el carrito
    this.cartService.getCartItems().pipe(take(1)).subscribe((cartItems: CartItem[]) => {
      const cartItem = cartItems.find(item => item.id === this.product.id);
      if (cartItem) {
        this.quantity = cartItem.quantity;
        this.isInCart = true;
      }
    });
    // Comprobar si el producto está en favoritos
    const user = await this.authService.getCurrentUser();
    if (user) {
      const favs = await this.supabaseService.getFavorites(user.id, 'product');
      this.isFavorite = favs.some((f: any) => f.product_id === this.product.id);
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

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/default-product.jpg';
    }
  }

  addToCart() {
    if (this.quantity > 0) {
      this.cartService.addToCart({
        id: this.product.id,
        name: this.product.name,
        price: this.product.offerPrice || this.product.price,
        quantity: this.quantity,
        imageUrl: this.product.imageUrl
      });
      
      // Mostrar notificación (opcional)
      this.notificationService.showSuccess('Producto añadido al carrito');
      
      // Cerrar el modal y pasar datos
      this.modalCtrl.dismiss({
        added: true,
        productId: this.product.id,
        quantity: this.quantity
      });
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async toggleFavorite() {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.notificationService.show({ message: 'Debes iniciar sesión para usar favoritos' });
      return;
    }
    if (this.isFavorite) {
      await this.supabaseService.removeFavorite(user.id, this.product.id, 'product');
      this.isFavorite = false;
      this.notificationService.show({ message: 'Eliminado de favoritos' });
    } else {
      await this.supabaseService.addFavorite(user.id, this.product.id, 'product');
      this.isFavorite = true;
      this.notificationService.show({ message: 'Añadido a favoritos' });
    }
  }
} 