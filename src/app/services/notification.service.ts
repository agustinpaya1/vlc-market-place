import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  message: string;
  type?: NotificationType;
  duration?: number;
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
    const toast = await this.toastController.create({
      message: options.message,
      duration: options.duration || 1200,
      position: 'top',
      color: 'success',
      cssClass: 'subtle-toast',
      buttons: options.action ? [
        {
          text: options.action.text,
          handler: options.action.handler,
          role: 'action'
        }
      ] : []
    });
    await toast.present();
  }

  async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1200,
      position: 'top',
      color: 'success',
      cssClass: 'subtle-toast'
    });
    await toast.present();
  }

  async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1200,
      position: 'top',
      color: 'success',
      cssClass: 'subtle-toast'
    });
    await toast.present();
  }

  async showWarning(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1200,
      position: 'top',
      color: 'success',
      cssClass: 'subtle-toast'
    });
    await toast.present();
  }

  async showInfo(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1200,
      position: 'top',
      color: 'success',
      cssClass: 'subtle-toast'
    });
    await toast.present();
  }
} 