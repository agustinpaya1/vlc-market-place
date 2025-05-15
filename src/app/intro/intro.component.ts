import { Component, OnInit, OnDestroy, Renderer2, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { Platform } from '@ionic/angular/standalone';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon
  ]
})
export class IntroComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  isFinishing = false;
  private slideInterval: any;
  private animationFrameId: number | null = null;
  private resizeListener: () => void;
  
  constructor(
    private router: Router,
    private storage: Storage,
    private renderer: Renderer2,
    private platform: Platform,
    private ngZone: NgZone
  ) {
    // Registrar iconos utilizados
    addIcons({ arrowForwardOutline });
    
    // Definimos la función para manejar el resize una sola vez
    this.resizeListener = () => {
      // Cancelar cualquier solicitud de animación pendiente
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
      
      // Programar la próxima animación para el siguiente frame para evitar múltiples recálculos
      this.animationFrameId = requestAnimationFrame(() => {
        // El código aquí se ejecutará en el próximo frame de animación
        // Ajustes de UI que dependen del tamaño, si los hubiera
        this.animationFrameId = null;
      });
    };
  }

  async ngOnInit() {
    await this.storage.create();
    
    // Optimización: agregar los event listeners de forma eficiente
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.resizeListener, { passive: true });
    });
    
    // Optimización: Precarga de imágenes
    this.preloadIntroImages();
  }
  
  ngOnDestroy() {
    // Limpieza de recursos
    window.removeEventListener('resize', this.resizeListener);
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private preloadIntroImages() {
    const imagePaths = [
      'assets/intro/slide1.svg', 
      'assets/intro/slide2.svg', 
      'assets/intro/slide3.svg'
    ];
    
    imagePaths.forEach(path => {
      const img = new Image();
      img.src = path;
    });
  }

  nextSlide() {
    // Ejecutar fuera de la zona de Angular para evitar ciclos de detección innecesarios
    this.ngZone.runOutsideAngular(() => {
      if (this.currentSlide < 3) {
        this.ngZone.run(() => {
          this.currentSlide++;
        });
      }
    });
  }

  previousSlide() {
    this.ngZone.runOutsideAngular(() => {
      if (this.currentSlide > 0) {
        this.ngZone.run(() => {
          this.currentSlide--;
        });
      }
    });
  }

  async skip() {
    await this.completeIntro();
  }

  async finish() {
    if (this.isFinishing) return;
    this.isFinishing = true;
    
    // Buscar el slide actual y añadir una clase para la animación de salida
    const currentSlide = document.querySelector('.intro-slide.active') as HTMLElement;
    if (currentSlide) {
      this.renderer.addClass(currentSlide, 'exit-animation');
      
      // Ejecutar fuera de la zona de Angular para evitar ciclos de detección innecesarios
      this.ngZone.runOutsideAngular(() => {
        // Esperar a que la animación termine antes de completar
        setTimeout(() => {
          this.ngZone.run(async () => {
            await this.completeIntro();
          });
        }, 600);
      });
    } else {
      // Si no se puede encontrar el slide, navegar directamente
      await this.completeIntro();
    }
  }

  private async completeIntro() {
    try {
      console.log('Completando intro y estableciendo flags para evitar mostrarla en refrescos');
      
      // Marcar la introducción como completada
      await this.storage.set('introShown', true);
      
      // Marcar la sesión como activa para evitar que se muestre intro en los refrescos
      // Lo añadimos con un retraso 0 para asegurar que se guarde antes de la navegación
      sessionStorage.setItem('activeSession', 'true');
      
      // Para depurar el estado actual
      const currentIntroShown = await this.storage.get('introShown');
      const currentSession = sessionStorage.getItem('activeSession');
      console.log('Estado después de completar intro:', {
        introShown: currentIntroShown,
        sessionActive: currentSession
      });
      
      console.log('Navegando a /tabs después de completar intro');
      
      // Navegación: siempre navega a la página principal después de la intro
      this.ngZone.run(() => {
        this.router.navigate(['/tabs/stores'], { 
          replaceUrl: true 
        }).then(() => {
          console.log('Navegación completada');
          // Doble comprobación después de navegación
          console.log('Comprobando sessionStorage después de navegación:', 
            sessionStorage.getItem('activeSession'));
        }).catch(err => {
          console.error('Error en navegación:', err);
        });
      });
    } catch (error) {
      console.error('Error al completar la introducción:', error);
      // Como respaldo, intentar navegar directamente
      sessionStorage.setItem('activeSession', 'true');
      this.router.navigate(['/tabs/stores'], { replaceUrl: true });
    }
  }
}
