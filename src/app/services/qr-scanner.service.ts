import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Platform } from '@ionic/angular';
import { NotificationService } from './notification.service';
import { BrowserQRCodeReader } from '@zxing/browser';

interface Point {
  x: number;
  y: number;
}

interface QRCode {
  data: string;
  location: {
    topLeftCorner: Point;
    topRightCorner: Point;
    bottomRightCorner: Point;
    bottomLeftCorner: Point;
  };
}

// @ts-ignore
const jsQR = require('jsqr') as (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts: 'dontInvert' | 'onlyInvert' | 'attemptBoth' }
) => QRCode | null;

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {
  private codeReader: BrowserQRCodeReader | null = null;
  private scanning = false;

  constructor(
    private platform: Platform,
    private notificationService: NotificationService
  ) {
    this.codeReader = new BrowserQRCodeReader();
  }

  async hasPermission(): Promise<boolean> {
    try {
      if (this.platform.is('capacitor')) {
        const status = await BarcodeScanner.checkPermission({ force: true });
        return status.granted || false;
      }
      
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('getUserMedia no está soportado en este navegador');
        this.notificationService.show({
          message: 'Tu navegador no soporta el acceso a la cámara',
          type: 'error',
          duration: 3000
        });
        return false;
      }

      // Verificar si hay dispositivos de video disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        console.error('No se encontraron cámaras disponibles');
        this.notificationService.show({
          message: 'No se encontró ninguna cámara en tu dispositivo',
          type: 'error',
          duration: 3000
        });
        return false;
      }

      // Intentar obtener acceso a la cámara
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment'
          } 
        });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        this.notificationService.show({
          message: 'Error al acceder a la cámara. Por favor, verifica los permisos',
          type: 'error',
          duration: 3000
        });
        return false;
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    return this.hasPermission();
  }

  async startScan(): Promise<string> {
    try {
      if (this.platform.is('capacitor')) {
        return this.startNativeScan();
      } else {
        return this.startWebScan();
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      return '';
    }
  }

  private async startNativeScan(): Promise<string> {
    try {
      document.querySelector('body')?.classList.add('scanner-active');
      await BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();
      document.querySelector('body')?.classList.remove('scanner-active');

      if (result.hasContent) {
        return result.content;
      }
      return '';
    } catch (error) {
      console.error('Error in native scan:', error);
      document.querySelector('body')?.classList.remove('scanner-active');
      return '';
    }
  }

  private async startWebScan(): Promise<string> {
    try {
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        return '';
      }

      // Obtener lista de cámaras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Intentar usar la última cámara (generalmente la trasera en móviles)
      const deviceId = videoDevices.length > 0 ? videoDevices[videoDevices.length - 1].deviceId : undefined;

      // Crear el contenedor para el video
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.backgroundColor = '#000';
      container.style.zIndex = '9999';
      document.body.appendChild(container);

      // Botón para cerrar
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Cerrar';
      closeButton.style.position = 'fixed';
      closeButton.style.bottom = '20px';
      closeButton.style.left = '50%';
      closeButton.style.transform = 'translateX(-50%)';
      closeButton.style.zIndex = '10000';
      closeButton.style.padding = '10px 20px';
      closeButton.style.backgroundColor = '#fff';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '5px';
      container.appendChild(closeButton);

      // Crear elemento de video
      const videoElement = document.createElement('video');
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      container.appendChild(videoElement);

      return new Promise<string>((resolve) => {
        let scanSubscription: { stop: () => void } | null = null;

        const cleanup = () => {
          if (scanSubscription) {
            scanSubscription.stop();
          }
          container.remove();
        };

        closeButton.onclick = () => {
          cleanup();
          resolve('');
        };

        if (this.codeReader) {
          // @ts-ignore
          this.codeReader.decodeFromVideoDevice(deviceId, videoElement, (result, error) => {
            if (result) {
              cleanup();
              // @ts-ignore
              resolve(result.getText());
            }
            if (error) {
              console.error('Error scanning:', error);
            }
          })
            .then(controls => {
              scanSubscription = controls;
            })
            .catch(error => {
              console.error('Error starting scan:', error);
              cleanup();
              resolve('');
            });
        } else {
          cleanup();
          resolve('');
        }
      });
    } catch (error) {
      console.error('Error in web scan:', error);
      this.notificationService.show({
        message: 'Error al iniciar el escáner',
        type: 'error',
        duration: 3000
      });
      return '';
    }
  }

  async stopScan() {
    this.scanning = false;
    if (this.platform.is('capacitor')) {
      await BarcodeScanner.stopScan();
      document.querySelector('body')?.classList.remove('scanner-active');
    }
  }

  resetPermissions() {
    this.scanning = false;
  }
} 