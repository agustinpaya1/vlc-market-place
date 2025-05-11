import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { PaymentService } from './payment.service';
import { SettingsService } from './settings.service';
import { NotificationService } from './notification.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    PaymentService,
    SettingsService,
    NotificationService
  ]
})
export class ServicesModule {} 