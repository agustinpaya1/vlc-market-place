import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
export class QrScannerModalComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  private reader: BrowserQRCodeReader | null = null;
  private controls: IScannerControls | null = null;
  private stream: MediaStream | null = null;
  torchEnabled = false;
  torchSupported = false;

  constructor(private modalCtrl: ModalController) {}

  async ngOnInit() {
    await this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private async start() {
    try {
      if (!this.reader) this.reader = new BrowserQRCodeReader();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
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

      // Detectar soporte de torch
      const mediaStream = this.videoRef.nativeElement.srcObject as MediaStream | null;
      this.stream = mediaStream || null;
      const track = this.stream?.getVideoTracks()?.[0];
      const caps: any = track?.getCapabilities?.();
      this.torchSupported = !!caps?.torch;
      console.log('[QrScannerModal] Torch supported:', this.torchSupported);
    } catch (e) {
      console.error('Error iniciando escáner:', e);
    }
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


