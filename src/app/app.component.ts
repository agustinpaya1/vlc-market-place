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
  private authChecked = false;
  
  constructor(
    private router: Router,
    private storage: Storage,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    
    // Resetear el flag de intro para forzar que se muestre siempre (temporal)
    await this.resetIntroFlag();
    
    // Suscribirse al estado de autenticación
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.authChecked = true;
      console.log('Estado de autenticación:', this.isAuthenticated ? 'Autenticado' : 'No autenticado');
      
      if (this.initialNavigation && this.authChecked) {
        this.checkInitialRoute();
      }
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
      
      // Si es una navegación a reset-password, respetar esa navegación
      if (url.includes('/reset-password')) {
        console.log('Navegación a reset-password detectada, respetando la ruta');
        this.initialNavigation = false;
        return;
      }
      
      // Si estamos navegando a la raíz, aplicar la lógica de redirección
      if (url === '/') {
        if (this.authChecked) {
          this.checkInitialRoute();
        }
      } else {
        // Si ya estamos navegando a una URL específica, no interferir
        this.initialNavigation = false;
      }
    });
  }
  
  private async checkInitialRoute() {
    try {
      // Primero comprobamos si ya estamos en una sesión de navegación activa (refresh)
      if (sessionStorage.getItem('activeSession') === 'true') {
        console.log('Sesión activa detectada, NUNCA mostrar intro después de refresh');
        this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
        this.initialNavigation = false;
        return;
      }
      
      // Verificar si estamos en una ruta de reset password
      const currentUrl = window.location.href;
      console.log('URL actual al verificar ruta inicial:', currentUrl);
      
      // Comprobar si la URL contiene indicios de un flujo de recuperación de contraseña
      const isResetPasswordFlow = 
        currentUrl.includes('/reset-password') || 
        currentUrl.includes('type=recovery') || 
        currentUrl.includes('access_token=') ||
        currentUrl.includes('token=') ||
        /reset[_-]?password|recovery|forgot/i.test(currentUrl);
      
      // Si estamos en un flujo de recuperación de contraseña, ir directo a reset-password
      if (isResetPasswordFlow) {
        console.log('Flujo de recuperación de contraseña detectado, navegando a reset-password');
        // Usar navigateByUrl para mantener los parámetros de consulta y fragmentos
        this.router.navigateByUrl('/reset-password', { 
          replaceUrl: true,
          skipLocationChange: false // Importante: NO omitir el cambio de ubicación
        });
        this.initialNavigation = false;
        return;
      }
      
      // Comprobar si las pantallas de introducción ya se han mostrado
      const introShown = await this.storage.get('introShown');
      console.log('¿Intro mostrada previamente?', introShown ? 'Sí' : 'No');
      
      // Marcar inmediatamente que hay una sesión activa para evitar intro en refrescos
      // Hacemos esto ANTES de la navegación para asegurar que quede registrado
      sessionStorage.setItem('activeSession', 'true');
      
      // Si intro no se ha mostrado antes, mostrar la intro
      if (introShown !== true) {
        console.log('Mostrando la intro por primera vez');
        this.router.navigateByUrl('/intro', { replaceUrl: true });
        this.initialNavigation = false;
        return;
      }
      
      // Si el usuario está autenticado, llevarlo a la página principal
      if (this.isAuthenticated) {
        console.log('Usuario autenticado, navegando a tiendas');
        this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
      } else {
        // Si el usuario no está autenticado, mostrar también la página principal
        console.log('Usuario no autenticado, navegando directamente a tiendas');
        this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
      }
      
      this.initialNavigation = false;
    } catch (error) {
      console.error('Error al verificar el estado inicial:', error);
      // En caso de error, marcar la sesión como activa para evitar intro en refrescos
      sessionStorage.setItem('activeSession', 'true');
      
      // Si hay error, ir a tiendas como opción segura
      this.router.navigateByUrl('/tabs/stores', { replaceUrl: true });
      this.initialNavigation = false;
    }
  }
  
  // Este método puede usarse para permitir la ejecución de la aplicación sin mostrar el intro
  private async resetIntroFlag() {
    try {
      // SIEMPRE eliminar las banderas al inicio de la aplicación para asegurar
      // que la intro se muestre en cada nuevo inicio con "run web"
      console.log('Reseteando flags para mostrar intro en nuevo inicio');
      
      // Eliminar marca de intro mostrada
      await this.storage.remove('introShown');
      console.log('Flag introShown eliminado correctamente');
      
      // Eliminar sesión activa (para evitar confusiones)
      sessionStorage.removeItem('activeSession');
      console.log('Flag activeSession removido correctamente');
    } catch (error) {
      console.error('Error al resetear flags de intro:', error);
      // En caso de error, intentar directamente remover solo el introShown
      try {
        await this.storage.remove('introShown');
      } catch (secondError) {
        console.error('Error crítico en storage:', secondError);
      }
    }
    
    // Para depurar el estado actual
    try {
      const currentIntroShown = await this.storage.get('introShown');
      const currentSession = sessionStorage.getItem('activeSession');
      console.log('Estado actual después de reseteo:', {
        introShown: currentIntroShown,
        sessionActive: currentSession
      });
    } catch (error) {
      console.error('Error al obtener estado actual:', error);
    }
  }
}
