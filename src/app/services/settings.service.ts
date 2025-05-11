import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from './notification.service';

export type LanguageCode = 'es' | 'en' | 'ca';

export interface Settings {
  darkMode: boolean;
  notifications: boolean;
  language: LanguageCode;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings = new BehaviorSubject<Settings>({
    darkMode: false,
    notifications: true,
    language: 'es'
  });

  constructor(private notificationService: NotificationService) {
    // Initialize with system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const initialSettings = this.settings.value;
    initialSettings.darkMode = prefersDark.matches;
    this.settings.next(initialSettings);
    
    // Listen for system preference changes
    prefersDark.addEventListener('change', (mediaQuery) => {
      const currentSettings = this.settings.value;
      currentSettings.darkMode = mediaQuery.matches;
      this.settings.next(currentSettings);
      this.applySettings(currentSettings);
    });

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
      this.settings.next(parsed);
      this.applySettings(this.settings.value);
    }
  }

  private saveSettings(settings: Settings) {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    this.settings.next(settings);
    this.applySettings(settings);
  }

  private applySettings(settings: Settings) {
    // Apply dark mode to documentElement
    document.documentElement.classList.toggle('dark', settings.darkMode);
    
    // Apply language
    document.documentElement.lang = settings.language;
  }

  setDarkMode(enabled: boolean) {
    const currentSettings = this.settings.value;
    this.saveSettings({
      ...currentSettings,
      darkMode: enabled
    });
    this.notificationService.showSuccess(
      enabled ? 'Modo oscuro activado' : 'Modo oscuro desactivado'
    );
  }

  setNotifications(enabled: boolean) {
    const currentSettings = this.settings.value;
    this.saveSettings({
      ...currentSettings,
      notifications: enabled
    });
    this.notificationService.showSuccess(
      enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas'
    );
  }

  setLanguage(language: LanguageCode) {
    const currentSettings = this.settings.value;
    this.saveSettings({
      ...currentSettings,
      language
    });
    this.notificationService.showSuccess('Idioma actualizado');
  }

  async clearCache() {
    // Clear browser cache
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        this.notificationService.showSuccess('Caché limpiado correctamente');
      } catch (error) {
        this.notificationService.showError('Error al limpiar el caché');
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