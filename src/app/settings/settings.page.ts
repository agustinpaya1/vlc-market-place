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
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
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
export class SettingsPage {
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
