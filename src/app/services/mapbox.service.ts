import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Injectable({
  providedIn: 'root'
})
export class MapboxService {
  private map: mapboxgl.Map | null = null;
  private markers: mapboxgl.Marker[] = [];

  constructor() {
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoianVhbmpvc2VydWl6IiwiYSI6ImNtOWlkdmdjYTAxNWIyanF3Mmg4NmJjeDkifQ.i1uWtbQazE35o9Vtyv_oBA';
  }

  initializeMap(container: string, center: [number, number] = [-0.4816, 38.3452]): void {
    this.map = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: 13
    });

    this.map.addControl(new mapboxgl.NavigationControl());
  }

  addMarker(coordinates: [number, number], title: string): void {
    if (!this.map) return;

    const el = document.createElement('div');
    el.className = 'store-marker';
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.backgroundColor = 'black';
    el.style.border = '2px solid white';
    el.style.borderRadius = '2px';
    el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';

    const marker = new mapboxgl.Marker(el)
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<b>${title}</b>`))
      .addTo(this.map);

    this.markers.push(marker);
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  setCenter(coordinates: [number, number]): void {
    if (this.map) {
      this.map.flyTo({
        center: coordinates,
        essential: true
      });
    }
  }
} 