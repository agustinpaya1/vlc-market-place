import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { MapService } from '../services/map.service';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

interface Store {
  name: string;
  coordinates: [number, number];
}

@Component({
  selector: 'app-locations',
  templateUrl: './locations.page.html',
  styleUrls: ['./locations.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, CommonModule, FormsModule]
})
export class LocationsPage implements OnInit, AfterViewInit {
  constructor(
    private mapService: MapService,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

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

  viewStore(storeId: string) {
    console.log('Navegando a la tienda con ID:', storeId);
    this.router.navigate(['/tabs/store', storeId]);
  }

  getPublicImageUrl(path: string): string {
    return this.supabaseService.getPublicImageUrl(path);
  }
} 