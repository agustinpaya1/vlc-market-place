import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPopover,
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
  ellipsisVertical,
  locationOutline,
  moonOutline,
  optionsOutline,
  sunnyOutline,
  timeOutline
} from 'ionicons/icons';
import mapboxgl from 'mapbox-gl';
import { AuthService } from '../services/auth.service';

interface Store {
  id: string;
  name: string;
  distance: number;
  schedule: string;
  phone: string;
  isOpen: boolean;
  coordinates: [number, number];
}

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonSearchbar,
    IonModal,
    IonToggle,
    IonRange,
    IonSelect,
    IonSelectOption,
    IonFab,
    IonFabButton
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Tab5Page implements OnInit, OnDestroy, AfterViewInit {
  private map!: mapboxgl.Map;
  private readonly mapboxToken = 'pk.eyJ1IjoianVhbmpvc2VydWl6IiwiYSI6ImNtOWlkdmdjYTAxNWIyanF3Mmg4NmJjeDkifQ.i1uWtbQazE35o9Vtyv_oBA';
  private markers: mapboxgl.Marker[] = [];
  private originalStores: Store[] = [];
  
  isDarkTheme = true;
  isBottomSheetActive = false;
  isAuthenticated = false;
  currentUser: any = null;
  
  stores: Store[] = [
    {
      id: '1',
      name: 'Mercado Central',
      distance: 0.2,
      schedule: '7:00 AM - 3:00 PM',
      phone: '+34 963 82 91 00',
      isOpen: true,
      coordinates: [-0.37739, 39.47391]
    },
    {
      id: '2',
      name: 'Mercado de Colón',
      distance: 1.5,
      schedule: '8:00 AM - 10:00 PM',
      phone: '+34 963 37 42 00',
      isOpen: true,
      coordinates: [-0.36539, 39.46991]
    },
    {
      id: '3',
      name: 'Mercado de Ruzafa',
      distance: 2.1,
      schedule: '7:00 AM - 3:00 PM',
      phone: '+34 963 74 12 00',
      isOpen: false,
      coordinates: [-0.37039, 39.46191]
    }
  ];

  showFilters = false;
  showOnlyOpen = false;
  maxDistance = 5;
  selectedCategories: string[] = [];

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      ellipsisVertical,
      locationOutline,
      timeOutline,
      callOutline,
      closeOutline,
      checkmarkCircle,
      closeCircle,
      sunnyOutline,
      moonOutline,
      optionsOutline
    });
    
    // Set Mapbox access token
    (mapboxgl as any).accessToken = this.mapboxToken;
    
    // Subscribe to authentication state
    this.authService.user$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
    });
    
    // Guardar copia de las tiendas originales
    this.originalStores = [...this.stores];
  }

  ngOnInit() {}

  ngAfterViewInit() {
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
      const markerElement = document.createElement('div');
      markerElement.className = 'store-marker';
      markerElement.innerHTML = `
        <div class="marker-dot ${store.isOpen ? 'open' : 'closed'}"></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <h3>${store.name}</h3>
          <p>${store.schedule}</p>
          <p>${store.phone}</p>
          <p>${store.isOpen ? 'Abierto' : 'Cerrado'}</p>
        `);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(store.coordinates)
        .setPopup(popup)
        .addTo(this.map);

      this.markers.push(marker);

      markerElement.addEventListener('click', () => {
        this.focusOnStore(store);
      });
    });
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    if (this.map) {
      this.map.setStyle(this.isDarkTheme ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/light-v10');
      this.map.once('style.load', () => {
        this.addStoreMarkers();
      });
    }
  }

  toggleBottomSheet() {
    this.isBottomSheetActive = !this.isBottomSheetActive;
  }

  focusOnStore(store: Store) {
    this.map.flyTo({
      center: store.coordinates,
      zoom: 16,
      essential: true
    });

    const marker = this.markers.find(m => 
      m.getLngLat().lng === store.coordinates[0] && 
      m.getLngLat().lat === store.coordinates[1]
    );
    
    if (marker) {
      marker.togglePopup();
      // Asegurarse de que el bottom sheet esté visible
      this.isBottomSheetActive = true;
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    // Comenzar con todas las tiendas originales
    let filteredStores = [...this.originalStores];

    // Aplicar filtros
    if (this.showOnlyOpen) {
      filteredStores = filteredStores.filter(store => store.isOpen);
    }

    filteredStores = filteredStores.filter(store => store.distance <= this.maxDistance);

    // Actualizar la lista de tiendas
    this.stores = filteredStores;

    // Actualizar los marcadores en el mapa
    this.addStoreMarkers();

    // Cerrar el modal de filtros
    this.showFilters = false;
  }
} 