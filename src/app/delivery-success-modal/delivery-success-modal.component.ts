import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delivery-success-modal',
  templateUrl: './delivery-success-modal.component.html',
  styleUrls: ['./delivery-success-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DeliverySuccessModalComponent {
  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private navCtrl: NavController
  ) {}

  goToHome() {
    // Cerrar el modal y navegar a la página principal
    this.modalCtrl.dismiss();
    
    // Navegar a la ruta principal (usar NavController para animaciones nativas)
    setTimeout(() => this.navCtrl.navigateRoot('/tabs/stores'), 300);
  }
}
