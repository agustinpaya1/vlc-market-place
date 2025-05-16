import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from './notification.service';

export type LanguageCode = 'es' | 'en' | 'ca';

export interface Settings {
  notifications: boolean;
  language: LanguageCode;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings = new BehaviorSubject<Settings>({
    notifications: true,
    language: 'es'
  });

  constructor(private notificationService: NotificationService) {
    this.loadSettings();
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Ensure language is valid
      if (!['es', 'en', 'ca'].includes(parsed.language)) {
        parsed.language = 'es';
      }
      this.settings.next({
        notifications: parsed.notifications ?? true,
        language: parsed.language ?? 'es'
      });
      this.applySettings(this.settings.value);
    }
  }

  private saveSettings(settings: Settings) {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    this.settings.next(settings);
    this.applySettings(settings);
  }

  private applySettings(settings: Settings) {
    // Apply language
    document.documentElement.lang = settings.language;
  }

  setNotifications(enabled: boolean) {
    const currentSettings = this.settings.value;
    this.saveSettings({
      ...currentSettings,
      notifications: enabled
    });
  }

  setLanguage(language: LanguageCode) {
    const currentSettings = this.settings.value;
    this.saveSettings({
      ...currentSettings,
      language
    });
  }

  async clearCache() {
    // Clear browser cache
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        // Optionally, can use NotificationService here but now we handle it in the component
      } catch (error) {
        console.error('Error al limpiar el caché', error);
      }
    }
    
    // Clear localStorage except settings and token
    const settingsBackup = localStorage.getItem('app_settings');
    const tokenBackup = localStorage.getItem('auth_token');
    localStorage.clear();
    if (settingsBackup) localStorage.setItem('app_settings', settingsBackup);
    if (tokenBackup) localStorage.setItem('auth_token', tokenBackup);
  }

  getSettings(): Observable<Settings> {
    return this.settings.asObservable();
  }
} 