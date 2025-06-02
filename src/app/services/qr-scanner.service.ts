import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Platform } from '@ionic/angular';
import { NotificationService } from './notification.service';
import jsQR from 'jsqr';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private scanning = false;
  private permissionGranted = false;

  constructor(
    private platform: Platform,
    private notificationService: NotificationService
  ) {}

  private isSafari(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('safari') && !userAgent.includes('chrome');
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async checkPermission(): Promise<boolean> {
    try {
      if (this.platform.is('capacitor')) {
        // En dispositivo móvil, usar el plugin de Capacitor
        const status = await BarcodeScanner.checkPermission({ force: false });
        if (status.granted) {
          return true;
        }
        if (status.denied || status.neverAsked) {
          const requestStatus = await BarcodeScanner.checkPermission({ force: true });
          return requestStatus.granted || false;
        }
        return false;
      } else {
        // En navegador web
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          this.notificationService.show({
            message: 'Tu navegador no soporta el acceso a la cámara',
            type: 'error',
            duration: 3000
          });
          return false;
        }

        // Si ya tenemos el permiso guardado, lo devolvemos
        if (this.permissionGranted) {
          return true;
        }

        try {
          // Intentar obtener acceso a la cámara directamente
          const constraints = {
            video: {
              facingMode: this.isIOS() ? 'environment' : { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // Si llegamos aquí, el permiso fue concedido
          this.permissionGranted = true;
          
          // Limpiamos el stream de prueba
          stream.getTracks().forEach(track => track.stop());
          
          return true;
        } catch (error: any) {
          console.error('Error accessing camera:', error);
          
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            if (this.isSafari()) {
              this.notificationService.show({
                message: 'Por favor, permite el acceso a la cámara en los ajustes de Safari',
                type: 'warning',
                duration: 5000
              });
            } else {
              this.notificationService.show({
                message: 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.',
                type: 'warning',
                duration: 4000
              });
            }
          } else if (error.name === 'NotFoundError') {
            this.notificationService.show({
              message: 'No se encontró ninguna cámara en tu dispositivo',
              type: 'error',
              duration: 3000
            });
          }
          
          return false;
        }
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }

  async startScan(): Promise<string> {
    if (this.platform.is('capacitor')) {
      return this.startNativeScan();
    } else {
      return this.startWebScan();
    }
  }

  private async startNativeScan(): Promise<string> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return '';
      }

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
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return '';
      }

      // Crear elementos de video y canvas si no existen
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('playsinline', 'true');
        this.videoElement.setAttribute('autoplay', 'true');
      }
      
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas');
        this.canvasContext = this.canvasElement.getContext('2d');
      }

      try {
        const constraints = {
          video: {
            facingMode: this.isIOS() ? 'environment' : { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!this.videoElement) return '';
        
        this.videoElement.srcObject = this.stream;
        
        // Esperar a que el video esté listo
        await new Promise((resolve) => {
          if (this.videoElement) {
            this.videoElement.onloadedmetadata = () => {
              resolve(true);
            };
          }
        });

        await this.videoElement.play();

        // Configurar dimensiones
        if (this.canvasElement && this.videoElement) {
          this.canvasElement.width = this.videoElement.videoWidth;
          this.canvasElement.height = this.videoElement.videoHeight;
        }

        // Iniciar escaneo
        return new Promise((resolve) => {
          this.scanning = true;
          const scan = () => {
            if (!this.scanning) {
              resolve('');
              return;
            }

            if (this.videoElement && this.canvasContext && this.canvasElement) {
              try {
                this.canvasContext.drawImage(
                  this.videoElement,
                  0,
                  0,
                  this.canvasElement.width,
                  this.canvasElement.height
                );

                const imageData = this.canvasContext.getImageData(
                  0,
                  0,
                  this.canvasElement.width,
                  this.canvasElement.height
                );

                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                  this.scanning = false;
                  this.stopWebScan();
                  resolve(code.data);
                  return;
                }
              } catch (error) {
                console.error('Error during QR scan:', error);
              }
            }

            requestAnimationFrame(scan);
          };

          scan();
        });
      } catch (error) {
        console.error('Error starting web scan:', error);
        this.notificationService.show({
          message: 'Error al acceder a la cámara. Por favor, asegúrate de que tienes una cámara disponible y has dado los permisos necesarios.',
          type: 'error',
          duration: 4000
        });
        return '';
      }
    } catch (error) {
      console.error('Error in web scan:', error);
      return '';
    }
  }

  private stopWebScan() {
    this.scanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  async stopScan() {
    if (this.platform.is('capacitor')) {
      await BarcodeScanner.stopScan();
      document.querySelector('body')?.classList.remove('scanner-active');
    } else {
      this.stopWebScan();
    }
  }

  resetPermissions() {
    this.permissionGranted = false;
  }
} 