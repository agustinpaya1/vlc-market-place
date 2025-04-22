import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { MapService } from '../services/map.service';

interface Store {
  name: string;
  coordinates: [number, number];
}

@Component({
  selector: 'app-locations',
  templateUrl: './locations.page.html',
  styleUrls: ['./locations.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LocationsPage implements OnInit, AfterViewInit {
  constructor(private mapService: MapService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.mapService.initializeMap('map');
      const stores: Store[] = [
        { name: 'Tienda Central', coordinates: [38.3452, -0.4816] },
        { name: 'Tienda Norte', coordinates: [38.3652, -0.4816] },
        { name: 'Tiend∫a Sur', coordinates: [38.3252, -0.4816] },
        { name: 'Tienda Este', coordinates: [38.3452, -0.4616] },
        { name: 'Tienda Oeste', coordinates: [38.3452, -0.5016] }
      ];
      stores.forEach(store => {
        this.mapService.addMarker(store.coordinates, store.name);
      });
    }, 500);
  }
} 