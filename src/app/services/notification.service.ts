import { Injectable } from '@angular/core';
import { ToastController, ToastButton } from '@ionic/angular/standalone';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  message: string;
  type?: NotificationType;
  duration?: number;
  icon?: string;
  position?: 'top' | 'middle' | 'bottom';
  action?: {
    text: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastController: ToastController) {}

  private getColorByType(type: NotificationType = 'info'): string {
    // No necesitamos este método ya que usaremos nuestras propias clases CSS
    return '';
  }

  async show(options: NotificationOptions) {
    const type = options.type || 'info';
    const duration = options.duration || 2000;
    const position = options.position || 'top';
    
    const toastClass = `modern-toast toast-${type}`;

    const buttons: ToastButton[] = options.action ? [{
      side: 'end' as const,
      text: options.action.text,
      handler: options.action.handler
    }] : [];

    const toast = await this.toastController.create({
      message: options.message,
      duration,
      position,
      cssClass: toastClass,
      buttons,
      icon: options.icon,
      color: 'none' // Esto evita que Ionic aplique sus colores por defecto
    });

    await toast.present();
    return toast;
  }

  async showSuccess(message: string, options: Partial<NotificationOptions> = {}) {
    return this.show({
      message,
      type: 'success',
      icon: options.icon || 'checkmark-circle',
      duration: options.duration || 1500,
      position: options.position || 'top',
      action: options.action
    });
  }

  async showError(message: string, options: Partial<NotificationOptions> = {}) {
    return this.show({
      message,
      type: 'error',
      icon: options.icon || 'alert-circle',
      duration: options.duration || 3000,
      position: options.position || 'top',
      action: options.action
    });
  }

  async showWarning(message: string, options: Partial<NotificationOptions> = {}) {
    return this.show({
      message,
      type: 'warning',
      icon: options.icon || 'warning',
      duration: options.duration || 3000,
      position: options.position || 'top',
      action: options.action
    });
  }

  async showInfo(message: string, options: Partial<NotificationOptions> = {}) {
    return this.show({
      message,
      type: 'info',
      icon: options.icon || 'information-circle',
      duration: options.duration || 2000,
      position: options.position || 'top',
      action: options.action
    });
  }

  async showAuthRequired(message: string = 'Debes iniciar sesión para continuar', action: () => void) {
    return this.show({
      message,
      type: 'info',
      icon: 'lock-closed',
      duration: 4000,
      position: 'bottom',
      action: {
        text: 'Iniciar sesión',
        handler: action
      }
    });
  }
} 