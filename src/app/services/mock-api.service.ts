import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CartItem } from './cart.service';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Handle any URL containing create-payment-intent
    if (request.url.includes('create-payment-intent')) {
      console.log('Intercepting payment intent request:', request.url);
      return this.mockCreatePaymentIntent(request).pipe(delay(1000)); // Add 1 second delay to simulate server response time
    }
    
    // Pass through all other requests
    return next.handle(request);
  }
  
  private mockCreatePaymentIntent(request: HttpRequest<{amount: number, items: CartItem[]}>): Observable<HttpEvent<any>> {
    // Generate a mock client secret
    const clientSecret = `pi_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`;
    
    const response = {
      clientSecret: clientSecret,
      success: true
    };
    
    console.log('Generating mock payment intent response:', response);
    return of(new HttpResponse({ status: 200, body: response }));
  }
} 