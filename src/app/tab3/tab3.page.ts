import { Component } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon, 
  IonButtons, 
  IonPopover, 
  IonList, 
  IonItem, 
  IonLabel 
} from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton, 
    IonIcon, 
    IonButtons, 
    IonPopover, 
    IonList, 
    IonItem, 
    IonLabel,
    ExploreContainerComponent
  ]
})
export class Tab3Page {
  isMenuOpen = false;

  constructor() {}

  onLogin() {
    this.isMenuOpen = false;
    // Add your login logic here
    console.log('Login clicked');
  }

  onLogout() {
    this.isMenuOpen = false;
    // Add your logout logic here
    console.log('Logout clicked');
  }
}
