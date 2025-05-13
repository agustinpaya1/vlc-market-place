import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent implements OnInit {
  private initialNavigation = true;
  private isAuthenticated = false;
  
  constructor(
    private router: Router,
    private storage: Storage,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    
    // Suscribirse al estado de autenticación
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      console.log('Estado de autenticación:', this.isAuthenticated ? 'Autenticado' : 'No autenticado');
    });
    
    // Monitorear las navegaciones para evitar redirecciones incorrectas
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.url;
      console.log('Navegación a:', url);
      
      // Solo redirigir automáticamente en la primera carga
      if (!this.initialNavigation) {
        return;
      }
      
      // Si estamos navegando a la raíz, aplicar la lógica de redirección
      if (url === '/') {
        this.checkInitialRoute();
      } else {
        // Si ya estamos navegando a una URL específica, no interferir
        this.initialNavigation = false;
      }
    });
    
    // Verificar el estado inicial
    await this.checkInitialRoute();
  }
  
  private async checkInitialRoute() {
    try {
      // Verificar si estamos en una sesión activa (después de un refresh)
      const isActiveSession = sessionStorage.getItem('activeSession');
      
      if (isActiveSession === 'true') {
        console.log('Sesión activa detectada, evitando la intro después de refresh');
        this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
        this.initialNavigation = false;
        return;
      }
      
      // Comprobar si las pantallas de introducción ya se han mostrado
      const introShown = await this.storage.get('introShown');
      
      console.log('¿Intro mostrada previamente?', introShown ? 'Sí' : 'No');
      
      // Si intro no se ha mostrado antes, siempre mostrar la intro primero
      if (introShown !== true) {
        console.log('Mostrando la intro por primera vez');
        this.router.navigateByUrl('/intro', { replaceUrl: true });
        this.initialNavigation = false;
        return;
      }
      
      // Marcar que hay una sesión activa para evitar intro en refrescos de página
      sessionStorage.setItem('activeSession', 'true');
      
      // Si el usuario está autenticado, llevarlo a la página principal
      if (this.isAuthenticated) {
        console.log('Usuario autenticado, navegando a tiendas');
        this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
      } else {
        // Si el usuario no está autenticado, mostrar también la página principal
        // sin requerir inicio de sesión. El usuario podrá iniciar sesión cuando lo desee.
        console.log('Usuario no autenticado, navegando directamente a tiendas');
        this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
      }
      
      this.initialNavigation = false;
    } catch (error) {
      console.error('Error al verificar el estado inicial:', error);
      // En caso de error, intentar mostrar intro primero si nunca se ha mostrado
      const introShown = await this.storage.get('introShown');
      if (introShown !== true) {
        this.router.navigateByUrl('/intro', { replaceUrl: true });
      } else {
        // Establecer la sesión activa incluso en caso de error para evitar intro en refrescos
        sessionStorage.setItem('activeSession', 'true');
        this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
      }
      this.initialNavigation = false;
    }
  }
  
  // Este método puede usarse para forzar que se muestren los slides de introducción nuevamente
  private async resetIntroFlag() {
    try {
      await this.storage.remove('introShown');
      // También eliminar la marca de sesión activa
      sessionStorage.removeItem('activeSession');
      console.log('Flag introShown eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el flag introShown:', error);
    }
  }
}
