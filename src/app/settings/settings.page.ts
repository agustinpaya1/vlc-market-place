import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { SettingsService, Settings } from '../services/settings.service';
import { addIcons } from 'ionicons';
import { 
  moonOutline, 
  notificationsOutline, 
  languageOutline, 
  helpCircleOutline,
  logOutOutline,
  chevronForward,
  trashOutline
} from 'ionicons/icons';

type LanguageCode = 'es' | 'en' | 'ca';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  settings: Settings = {
    darkMode: false,
    notifications: true,
    language: 'es' as LanguageCode
  };

  private readonly languages: { [key in LanguageCode]: string } = {
    es: 'Español',
    en: 'English',
    ca: 'Català'
  };

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      moonOutline,
      notificationsOutline,
      languageOutline,
      helpCircleOutline,
      logOutOutline,
      chevronForward,
      trashOutline
    });
  }

  ngOnInit() {
    this.settingsService.getSettings().subscribe(settings => {
      this.settings = settings;
    });
  }

  toggleDarkMode() {
    this.settingsService.setDarkMode(!this.settings.darkMode);
  }

  toggleNotifications() {
    this.settingsService.setNotifications(!this.settings.notifications);
  }

  openLanguageSelector() {
    // TODO: Implement language selector
  }

  getLanguageName(code: LanguageCode): string {
    return this.languages[code];
  }

  async clearCache() {
    await this.settingsService.clearCache();
  }

  openHelp() {
    // TODO: Implement help page navigation
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/tabs/stores']);
  }
}
