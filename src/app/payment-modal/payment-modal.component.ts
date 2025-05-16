import { Component, OnInit, AfterViewInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonicModule } from '@ionic/angular';
import { PaymentService } from '../services/payment.service';
import { CartItem } from '../services/cart.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, cardOutline, close } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class PaymentModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cartItems: CartItem[] = [];
  @Input() totalAmount: number = 0;
  
  isLoading = false;
  errorMessage = '';
  paymentSuccess = false;
  paymentId = '';
  isCardComplete = false;

  vlcoinsToUse: number = 0;
  vlcoinBalance: number = 0;

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    addIcons({ checkmarkCircle, cardOutline, close });
  }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user && user.id) {
      // Consulta el balance real de la tabla vlcoin
      const { data, error } = await this.supabaseService.getClient()
        .from('vlcoin')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      this.vlcoinBalance = data?.balance || 0;
      this.vlcoinsToUse = 0;
    }
  }

  async ngAfterViewInit() {
    try {
      const cardElement = await this.paymentService.setupCardElement('card-element');
      
      // Listen for changes in the card element
      cardElement.on('change', (event) => {
        this.isCardComplete = event.complete;
        if (event.error) {
          this.errorMessage = event.error.message;
        } else {
          this.errorMessage = '';
        }
      });
    } catch (error) {
      this.errorMessage = 'Error setting up payment form. Please try again.';
    }
  }

  ngOnDestroy() {
    this.paymentService.destroyCardElement();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  async processPayment() {
    // Check if card is complete before proceeding
    if (!this.isCardComplete) {
      this.errorMessage = 'Por favor, introduce los datos de la tarjeta completos.';
      return;
    }
    if (this.vlcoinsToUse < 0 || this.vlcoinsToUse > this.vlcoinBalance) {
      this.errorMessage = 'Cantidad de VLCoins a usar no válida.';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      // In a real app, you would call your backend to create a payment intent
      const clientSecret = await this.paymentService.createPaymentIntent(
        this.cartItems, 
        this.totalAmount
      );
      
      const result = await this.paymentService.processPayment(clientSecret);
      this.paymentSuccess = result.success;
      this.paymentId = result.paymentId;
      
      if (this.paymentSuccess) {
        // 1. Obtener el usuario actual
        const user = await this.authService.getCurrentUser();
        if (!user || !user.id) {
          this.errorMessage = 'No se pudo obtener el usuario autenticado.';
          return;
        }
        // 1.1. Asegurar que existe fila en vlcoin
        const { data: existing, error: findError } = await this.supabaseService.getClient()
          .from('vlcoin')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (!existing) {
          await this.supabaseService.getClient()
            .from('vlcoin')
            .insert({ user_id: user.id, balance: 0 });
        }
        // 2. Guardar el pedido en Supabase
        const { error } = await this.supabaseService.getClient()
          .from('orders')
          .insert({
            user_id: user.id,
            total_price: this.totalAmount,
            status: 'pending',
            created_at: new Date().toISOString(),
            vlcoin_used: this.vlcoinsToUse
          });
        if (error) {
          this.errorMessage = 'Error guardando el pedido: ' + error.message;
          return;
        }
        // 3. Si se usaron VLCoins, actualiza el balance
        if (this.vlcoinsToUse > 0) {
          await this.supabaseService.getClient()
            .from('vlcoin')
            .update({ balance: this.vlcoinBalance - this.vlcoinsToUse })
            .eq('user_id', user.id);
        }
        // 4. Esperar y cerrar modal
        setTimeout(() => {
          this.modalCtrl.dismiss({ success: true, paymentId: this.paymentId }, 'success');
        }, 2000);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Error processing payment. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
} 