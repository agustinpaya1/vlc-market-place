import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module';

import { AppComponent } from './app/app.component';

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

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'md' // Tema Material Design
    }),
    importProvidersFrom(AppRoutingModule),
    importProvidersFrom(IonicStorageModule.forRoot()),
    provideHttpClient(withInterceptorsFromDi())
  ],
});
