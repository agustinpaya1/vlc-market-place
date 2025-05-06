import { Component, OnInit, AfterViewInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonicModule } from '@ionic/angular';
import { PaymentService } from '../services/payment.service';
import { CartItem } from '../services/cart.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, cardOutline, close } from 'ionicons/icons';

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

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService
  ) {
    addIcons({ checkmarkCircle, cardOutline, close });
  }

  ngOnInit() {}

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
        // Wait 2 seconds to show success message before closing
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