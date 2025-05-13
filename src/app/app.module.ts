import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ServicesModule } from './services/services.module';
import { MockApiInterceptor } from './services/mock-api.service';

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

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'md' // Usa el tema de Material Design para una apariencia más moderna
    }),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    CommonModule,
    HttpClientModule,
    ServicesModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: MockApiInterceptor, multi: true }
  ],
  bootstrap: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}