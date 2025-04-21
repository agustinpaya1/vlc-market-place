import { Component } from '@angular/core';
import { 
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
  IonContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { storefront, business, map, cart, settings } from 'ionicons/icons';
import { CartService } from '../services/cart.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge,
    IonContent
  ]
})
export class TabsPage {
  constructor(public cartService: CartService) {
    addIcons({ storefront, business, map, cart, settings });
  }
}
