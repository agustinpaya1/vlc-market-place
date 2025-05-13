import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

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
export class IntroComponent implements OnInit {
  currentSlide = 0;
  isFinishing = false;
  
  constructor(
    private router: Router,
    private storage: Storage,
    private renderer: Renderer2
  ) {
    // Registrar iconos utilizados
    addIcons({ arrowForwardOutline });
  }

  async ngOnInit() {
    await this.storage.create();
  }

  nextSlide() {
    if (this.currentSlide < 3) {
      this.currentSlide++;
    }
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
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
      
      // Esperar a que la animación termine antes de completar
      setTimeout(async () => {
        await this.completeIntro();
      }, 600);
    } else {
      // Si no se puede encontrar el slide, navegar directamente
      await this.completeIntro();
    }
  }

  private async completeIntro() {
    try {
      // Marcar la introducción como completada
      await this.storage.set('introShown', true);
      
      // Marcar la sesión como activa para evitar que se muestre intro en los refrescos
      sessionStorage.setItem('activeSession', 'true');
      
      console.log('Navegando a /tabs después de completar intro');
      
      // Navegación: siempre navega a la página principal después de la intro
      this.router.navigate(['/tabs/stores'], { 
        replaceUrl: true 
      }).then(() => {
        console.log('Navegación completada');
      }).catch(err => {
        console.error('Error en navegación:', err);
      });
    } catch (error) {
      console.error('Error al completar la introducción:', error);
      // Como respaldo, intentar navegar directamente
      sessionStorage.setItem('activeSession', 'true');
      this.router.navigate(['/tabs/stores'], { replaceUrl: true });
    }
  }
}
