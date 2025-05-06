import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { PaymentService } from './payment.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    PaymentService
  ]
})
export class ServicesModule {} 