import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pickup-order',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  template: `
    <div class="pickup-order-container">
      <h2>Pedido para Recoger</h2>
      <div class="order-details">
        <p><strong>Código de seguimiento:</strong> {{ trackingCode }}</p>
        <p><strong>Pedido:</strong> {{ orderId }}</p>
        <p *ngIf="orderDetails"><strong>Detalles:</strong> {{ orderDetails }}</p>
      </div>
      <div class="qr-section">
        <qrcode [qrdata]="trackingCode" [width]="200" [errorCorrectionLevel]="'M'"></qrcode>
        <p>Escanea este QR al recoger tu pedido</p>
      </div>
    </div>
  `,
  styles: [`
    .pickup-order-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
    }
    .order-details {
      margin-bottom: 2rem;
      text-align: center;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    qrcode {
      margin-bottom: 1rem;
    }
  `]
})
export class PickupOrderComponent {
  trackingCode: string = '';
  orderId: string = '';
  orderDetails: string = '';

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      this.trackingCode = params.get('trackingCode') || '';
    });
    this.route.queryParamMap.subscribe(params => {
      this.orderId = params.get('orderId') || '';
      this.orderDetails = params.get('orderDetails') || '';
    });
  }
} 