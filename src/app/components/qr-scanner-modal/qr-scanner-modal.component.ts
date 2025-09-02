import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import type { Result } from '@zxing/library';

@Component({
  selector: 'app-qr-scanner-modal',
  templateUrl: './qr-scanner-modal.component.html',
  styleUrls: ['./qr-scanner-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class QrScannerModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  private reader: BrowserQRCodeReader | null = null;
  private controls: IScannerControls | null = null;
  private stream: MediaStream | null = null;
  private videoDevices: MediaDeviceInfo[] = [];
  private currentDeviceIndex = 0;
  deviceLabel = '';
  torchEnabled = false;
  torchSupported = false;

  constructor(private modalCtrl: ModalController) {}

  async ngAfterViewInit() {
    await this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private async start() {
    try {
      // Evitar instancias duplicadas
      if (this.controls) {
        return;
      }

      // Asegurar estado limpio
      await this.stop();

      if (!this.reader) this.reader = new BrowserQRCodeReader();

      const constraints: MediaStreamConstraints = {
        video: await this.buildPreferredVideoConstraints()
      };

      // ZXing decodifica en bucle usando el elemento <video>
      this.controls = await this.reader.decodeFromConstraints(
        constraints,
        this.videoRef.nativeElement,
        (result: Result | undefined) => {
          if (result?.getText) {
            console.log('[QrScannerModal] QR detectado');
            this.finishWith(result.getText());
          }
        }
      );
      // Obtener stream para torch y limpieza
      const mediaStream = this.videoRef.nativeElement.srcObject as MediaStream | null;
      this.stream = mediaStream ?? null;
      const track = this.stream?.getVideoTracks()?.[0];
      const caps: any = track?.getCapabilities?.();
      this.torchSupported = !!caps?.torch;
      console.log('[QrScannerModal] Torch supported:', this.torchSupported);
    } catch (e) {
      console.error('Error iniciando escáner:', e);
    }
  }

  private async buildPreferredVideoConstraints(): Promise<MediaTrackConstraints> {
    try {
      // Pedir permiso rápidamente para poder leer labels
      const temp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      try { temp.getTracks().forEach(t => t.stop()); } catch {}

      const all = await navigator.mediaDevices.enumerateDevices();
      this.videoDevices = all.filter(d => d.kind === 'videoinput');

      // Elegir mejor cámara (evitar virtuales/OBS)
      const blacklist = ['virtual', 'obs', 'screen', 'display', 'snap', 'nvidia', 'manycam', 'xsplit', 'loopback'];
      const preferBack = ['back', 'rear', 'environment'];

      const nonBlacklisted = this.videoDevices.filter(d => {
        const l = (d.label || '').toLowerCase();
        return !blacklist.some(k => l.includes(k));
      });

      const baseList = nonBlacklisted.length > 0 ? nonBlacklisted : this.videoDevices;

      const scored = baseList.map((d, idx) => {
        const label = (d.label || '').toLowerCase();
        let score = 0;
        if (preferBack.some(k => label.includes(k))) score += 5;
        if (blacklist.some(k => label.includes(k))) score -= 10; // solo afecta si no hubo alternativas
        // Preferir no-integradas si hay varias
        if (label.includes('usb')) score += 2;
        return { d, idx, score };
      }).sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        const chosen = scored[0].d;
        this.currentDeviceIndex = this.videoDevices.findIndex(v => v.deviceId === chosen.deviceId) ?? 0;
        this.deviceLabel = chosen?.label || '';
        return {
          deviceId: { exact: chosen.deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } as MediaTrackConstraints;
      }
    } catch {}

    // Fallback
    return {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    } as MediaTrackConstraints;
  }

  async switchCamera() {
    if (!this.videoDevices || this.videoDevices.length < 2) return;
    this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.videoDevices.length;
    const next = this.videoDevices[this.currentDeviceIndex];
    this.deviceLabel = next?.label || '';
    await this.stop();
    if (!this.reader) this.reader = new BrowserQRCodeReader();
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: { exact: next.deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    this.controls = await this.reader.decodeFromConstraints(
      constraints,
      this.videoRef.nativeElement,
      (result: Result | undefined) => {
        if (result?.getText) this.finishWith(result.getText());
      }
    );
    const mediaStream = this.videoRef.nativeElement.srcObject as MediaStream | null;
    this.stream = mediaStream ?? null;
  }

  private async stop() {
    // ZXing
    if (this.controls) {
      try { this.controls.stop(); } catch {}
      this.controls = null;
    }
    // Camera
    if (this.stream) {
      try { this.stream.getTracks().forEach(t => t.stop()); } catch {}
      this.stream = null;
    }
  }

  async toggleTorch() {
    try {
      const track = this.stream?.getVideoTracks()?.[0];
      const caps: any = track?.getCapabilities?.();
      if (!track || !caps?.torch) return;
      this.torchEnabled = !this.torchEnabled;
      await (track as any).applyConstraints({ advanced: [{ torch: this.torchEnabled }] });
    } catch (e) {
      console.warn('Torch no soportado o fallo al aplicar constraints:', e);
    }
  }

  async close() {
    await this.stop();
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private async finishWith(value: string) {
    await this.stop();
    this.modalCtrl.dismiss({ value }, 'confirm');
  }
}


