import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  constructor() {}

  initializeMap(container: string, center: [number, number] = [38.3452, -0.4816]): void {
    this.map = L.map(container).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  addMarker(coordinates: [number, number] | number[], title: string): void {
    if (!this.map) return;
    const latLng: [number, number] = Array.isArray(coordinates) && coordinates.length === 2 
      ? [coordinates[0], coordinates[1]] 
      : [0, 0];

    const storeIcon = L.divIcon({
      className: 'store-marker',
      html: '<div style="background-color: black; width: 12px; height: 12px; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const marker = L.marker(latLng, { icon: storeIcon })
      .bindPopup(`<b>${title}</b>`)
      .addTo(this.map);
    this.markers.push(marker);
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  setCenter(coordinates: [number, number] | number[]): void {
    if (this.map) {
      const latLng: [number, number] = Array.isArray(coordinates) && coordinates.length === 2 
        ? [coordinates[0], coordinates[1]] 
        : [0, 0];
      this.map.setView(latLng, 13);
    }
  }
} 