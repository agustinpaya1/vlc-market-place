import { Component } from '@angular/core';
import { 
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { storefront, map, cart, person, storefrontOutline, mapOutline, cartOutline, personOutline } from 'ionicons/icons';
import { CartService } from '../services/cart.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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
    IonBadge
  ]
})
export class TabsPage {
  constructor(
    public cartService: CartService,
    private router: Router
  ) {
    addIcons({storefrontOutline,mapOutline,cartOutline,personOutline,storefront,map,cart,person});
  }

  navigateToProfile() {
    console.log('Intentando navegar a la página de perfil');
    this.router.navigate(['/tabs/profile']).then(
      success => console.log('Navegación exitosa:', success),
      error => console.error('Error en navegación:', error)
    );
  }
}
