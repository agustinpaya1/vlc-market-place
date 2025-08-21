import { Injectable } from '@angular/core';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import type { Result } from '@zxing/library';

@Injectable({ providedIn: 'root' })
export class QrScannerService {
  private reader: BrowserQRCodeReader | null = null;
  private controls: IScannerControls | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private permissionGranted = false;

  // === API que usa tu página ===
  async hasPermission(): Promise<boolean> {
    return this.checkPermission();
  }

  async checkPermission(): Promise<boolean> {
    const isLocalhost = ['localhost','127.0.0.1'].includes(location.hostname);
    if (location.protocol !== 'https:' && !isLocalhost) {
      console.warn('La cámara en web requiere HTTPS o http://localhost');
      // seguimos por si tu navegador lo permite en dev
    }
    if (!navigator.mediaDevices?.getUserMedia) return false;
    if (this.permissionGranted) return true;

    try {
      const test = await navigator.mediaDevices.getUserMedia({ video: true });
      test.getTracks().forEach(t => t.stop());
      this.permissionGranted = true;
      return true;
    } catch (e) {
      console.error('checkPermission error:', e);
      return false;
    }
  }

  async startScan(): Promise<string> {
    const ok = await this.checkPermission();
    if (!ok) return '';

    if (!this.reader) this.reader = new BrowserQRCodeReader();

    // Crea overlay de vídeo
    if (!this.videoEl) {
      this.videoEl = document.createElement('video');
      this.videoEl.setAttribute('playsinline', 'true');
      this.videoEl.setAttribute('autoplay', 'true');
      Object.assign(this.videoEl.style, {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        maxHeight: '60vh',
        zIndex: '9999',
        background: '#000',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,.35)'
      });
      document.body.appendChild(this.videoEl);
    }

    // Pide cámara trasera (constraints) y empieza a decodificar
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    return await new Promise<string>(async (resolve) => {
      try {
        this.controls = await this.reader!.decodeFromConstraints(
          constraints,
          this.videoEl!,
          (result: Result | undefined, err, controls: IScannerControls) => {
            if (result?.getText) {
              // QR leído
              this.stopScan().then(() => resolve(result.getText()));
            }
            // Los “no result” continuos son normales; ZXing sigue escaneando
          }
        );
      } catch (e) {
        console.error('decodeFromConstraints error:', e);
        // Fallback: abrir manualmente la cámara por si sirve en tu entorno
        try {
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);
          this.videoEl!.srcObject = this.stream;
          await this.videoEl!.play();
        } catch (e2) {
          console.error('Fallback getUserMedia error:', e2);
          resolve('');
        }
      }
    });
  }

  async stopScan(): Promise<void> {
    // Para el escaneo de ZXing
    if (this.controls) {
      try { this.controls.stop(); } catch {}
      this.controls = null;
    }

    // Apaga la cámara si quedó abierta
    if (this.stream) {
      try { this.stream.getTracks().forEach(t => t.stop()); } catch {}
      this.stream = null;
    }

    // Limpia el overlay
    if (this.videoEl) {
      try { this.videoEl.pause(); } catch {}
      try { this.videoEl.srcObject = null; } catch {}
      try { this.videoEl.remove(); } catch {}
      this.videoEl = null;
    }
  }

  resetPermissions() { this.permissionGranted = false; }
}
