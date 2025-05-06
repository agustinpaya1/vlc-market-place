import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { CartItem } from './cart.service';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;
  
  // For testing mode
  private useMockApi = true;

  constructor(private http: HttpClient) {
    this.initStripe();
  }

  async initStripe() {
    // Load Stripe using your publishable key from environment
    this.stripe = await loadStripe(environment.stripePublicKey);
  }

  async createPaymentIntent(cartItems: CartItem[], totalAmount: number) {
    // Use mock implementation for testing
    if (this.useMockApi) {
      console.log('Using mock payment intent for testing');
      // Generate a mock client secret
      const clientSecret = `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`;
      
      // Artificial delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return clientSecret;
    }
    
    // Real implementation for production
    try {
      const response = await firstValueFrom(
        this.http.post<{ clientSecret: string }>('/api/create-payment-intent', {
          amount: Math.round(totalAmount * 100), // Convert to cents
          items: cartItems
        })
      );
      return response.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async setupCardElement(elementId: string) {
    if (!this.stripe) {
      await this.initStripe();
    }

    if (this.stripe) {
      this.elements = this.stripe.elements();
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        },
        // For testing - only allow test cards
        hidePostalCode: true
      });
      
      this.cardElement.mount(`#${elementId}`);
      return this.cardElement;
    }
    
    throw new Error('Stripe failed to initialize');
  }

  async processPayment(clientSecret: string) {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe not initialized or card element not mounted');
    }

    try {
      // For testing, show successful transaction with mock client secret
      if (this.useMockApi && clientSecret.startsWith('pi_')) {
        console.log('Using mock payment processing for testing');
        // Artificial delay to simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
          success: true,
          paymentId: clientSecret.split('_')[1]
        };
      }
      
      // Real implementation
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: {
            // You can collect these details from the user if needed
            name: 'Cliente de Prueba'
          }
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else if (result.paymentIntent?.status === 'succeeded') {
        return {
          success: true,
          paymentId: result.paymentIntent.id
        };
      } else {
        throw new Error('Payment failed with status: ' + result.paymentIntent?.status);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    }
  }

  destroyCardElement() {
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
  }
} 