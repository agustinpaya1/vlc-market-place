import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Platform } from '@ionic/angular';
import {
    IonButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonRange,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToggle,
    IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    callOutline,
    checkmarkCircle,
    closeCircle,
    closeOutline,
    filterOutline,
    locationOutline,
    moonOutline,
    optionsOutline,
    sunnyOutline,
    timeOutline
} from 'ionicons/icons';
import mapboxgl from 'mapbox-gl';

interface Store {
  id: string;
  name: string;
  distance: number;
  schedule: string;
  phone: string;
  isOpen: boolean;
  coordinates: [number, number];
  description?: string;
}

@Component({
  selector: 'app-tab5',
  templateUrl: 'tab5.page.html',
  styleUrls: ['tab5.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonButtons,
    IonToggle,
    IonRange,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonChip
  ],
  standalone: true
})
export class Tab5Page implements OnInit, OnDestroy {
  private map!: mapboxgl.Map;
  private readonly mapboxToken = 'pk.eyJ1IjoianVhbmpvc2VydWl6IiwiYSI6ImNtOWlkdmdjYTAxNWIyanF3Mmg4NmJjeDkifQ.i1uWtbQazE35o9Vtyv_oBA';
  private markers: mapboxgl.Marker[] = [];
  
  // Estado de la UI
  showStores = false;
  showFilters = false;
  showOnlyOpen = false;
  maxDistance = 5;
  selectedCategories: string[] = [];
  isDarkTheme = true;
  
  stores: Store[] = [
    {
      id: '1',
      name: 'Mercado Central',
      distance: 0.2,
      schedule: '7:00 AM - 3:00 PM',
      phone: '+34 963 82 91 00',
      isOpen: true,
      coordinates: [-0.37739, 39.47391],
      description: 'Mercado histórico con arquitectura modernista, fundado en 1928.'
    },
    {
      id: '2',
      name: 'Mercado de Colón',
      distance: 1.5,
      schedule: '8:00 AM - 10:00 PM',
      phone: '+34 963 37 42 00',
      isOpen: true,
      coordinates: [-0.36539, 39.46991],
      description: 'Edificio modernista restaurado con cafeterías y tiendas gourmet.'
    },
    {
      id: '3',
      name: 'Mercado de Ruzafa',
      distance: 2.1,
      schedule: '7:00 AM - 3:00 PM',
      phone: '+34 963 74 12 00',
      isOpen: false,
      coordinates: [-0.37039, 39.46191],
      description: 'Mercado tradicional en el barrio bohemio de Ruzafa.'
    }
  ];

  constructor(private platform: Platform) {
    addIcons({
      locationOutline,
      timeOutline,
      callOutline,
      closeOutline,
      optionsOutline,
      filterOutline,
      checkmarkCircle,
      closeCircle,
      sunnyOutline,
      moonOutline
    });
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.initializeMap();
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    mapboxgl.accessToken = this.mapboxToken;
    
    this.map = new mapboxgl.Map({
      container: 'mapbox-map',
      style: this.isDarkTheme ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/light-v10',
      center: [-0.37739, 39.47391], // Valencia coordinates (Mercado Central)
      zoom: 14
    });

    this.map.on('load', () => {
      this.addStoreMarkers();
    });
  }

  private addStoreMarkers() {
    // Eliminar marcadores existentes
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Añadir nuevos marcadores
    this.stores.forEach(store => {
      // Crear el elemento del marcador
      const markerElement = document.createElement('div');
      markerElement.className = 'store-marker';
      markerElement.innerHTML = `
        <div class="marker-dot ${store.isOpen ? 'open' : 'closed'}"></div>
      `;

      // Crear el popup con la información del mercado
      const popup = new mapboxgl.Popup({ offset: 25, className: 'custom-popup' })
        .setHTML(`
          <div class="popup-content">
            <h3>${store.name}</h3>
            <p class="description">${store.description}</p>
            <p class="schedule">
              <ion-icon name="time-outline"></ion-icon>
              ${store.schedule}
            </p>
            <p class="phone">
              <ion-icon name="call-outline"></ion-icon>
              ${store.phone}
            </p>
            <div class="status ${store.isOpen ? 'open' : 'closed'}">
              ${store.isOpen ? 'Abierto' : 'Cerrado'}
            </div>
          </div>
        `);

      // Crear y añadir el marcador al mapa
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(store.coordinates)
        .setPopup(popup)
        .addTo(this.map);

      // Añadir el marcador al array de marcadores
      this.markers.push(marker);

      // Añadir evento click al marcador
      markerElement.addEventListener('click', () => {
        this.focusOnStore(store);
      });
    });
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    if (this.map) {
      this.map.setStyle(this.isDarkTheme ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/light-v10');
      // Volver a añadir los marcadores después de cambiar el estilo
      this.map.once('style.load', () => {
        this.addStoreMarkers();
      });
    }
  }

  toggleStoresPanel() {
    this.showStores = !this.showStores;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  searchStores(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    // Implementar lógica de búsqueda
  }

  focusOnStore(store: Store) {
    this.map.flyTo({
      center: store.coordinates,
      zoom: 16,
      essential: true
    });

    // Encontrar y mostrar el popup del marcador
    const marker = this.markers.find(m => 
      m.getLngLat().lng === store.coordinates[0] && 
      m.getLngLat().lat === store.coordinates[1]
    );
    marker?.togglePopup();
  }

  applyFilters() {
    // Implementar lógica de filtros
    this.toggleFilters();
  }
} 