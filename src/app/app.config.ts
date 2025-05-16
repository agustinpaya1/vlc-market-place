import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { NotificationService } from './services/notification.service';
import { SettingsService } from './services/settings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideIonicAngular({}),
    importProvidersFrom(IonicStorageModule.forRoot()),
    CartService,
    AuthService,
    SettingsService,
    NotificationService
  ]
};

// Mapbox configuration
import 'mapbox-gl';
const MAPBOX_TOKEN = 'pk.eyJ1IjoianVhbmpvc2VydWl6IiwiYSI6ImNtOWlkdmdjYTAxNWIyanF3Mmg4NmJjeDkifQ.i1uWtbQazE35o9Vtyv_oBA';
const mapboxgl = (window as any).mapboxgl;
if (mapboxgl) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  console.log('Mapbox token configurado globalmente:', mapboxgl.accessToken); 
} else {
  console.warn('mapboxgl no está disponible en window, el token no se ha configurado');
} 