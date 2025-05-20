import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

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
    const colors: Record<NotificationType, string> = {
      success: 'success',
      error: 'danger',
      warning: 'warning',
      info: 'primary'
    };
    return colors[type];
  }

  async show(options: NotificationOptions) {
    const type = options.type || 'info';
    const color = this.getColorByType(type);
    const duration = options.duration || 2000;
    const position = options.position || 'top';
    
    let message = options.message;
    if (options.icon) {
      message = `<ion-icon name="${options.icon}" style="margin-right: 8px; font-size: 1.2em; vertical-align: middle;"></ion-icon>${message}`;
    }

    const toast = await this.toastController.create({
      message: message,
      duration: duration,
      position: position,
      color: color,
      cssClass: `app-notification toast-${type} ${options.icon ? 'toast-with-icon' : ''}`,
      buttons: options.action ? [
        {
          text: options.action.text,
          handler: options.action.handler,
          role: 'action'
        }
      ] : []
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
    const toast = await this.toastController.create({
      message: `<ion-icon name="lock-closed-outline"></ion-icon> ${message}`,
      duration: 4000,
      position: 'bottom',
      buttons: [
        {
          text: 'Iniciar sesión',
          handler: action
        }
      ],
      cssClass: 'auth-required-toast'
    });
    await toast.present();
    return toast;
  }
} 