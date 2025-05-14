import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import {
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonChip,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonImg,
    IonRow,
    IonSearchbar,
    IonSkeletonText,
    IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    arrowForward,
    callOutline,
    cartOutline,
    cartSharp,
    checkmarkCircle,
    chevronBack,
    closeCircle,
    closeOutline,
    locationOutline,
    locationSharp,
    pricetagOutline,
    share,
    star,
    storefrontOutline,
    timeOutline,
    timeSharp
} from 'ionicons/icons';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  category: string;
  isOffer?: boolean;
  offerPrice?: number;
  stock: number;
  store_id?: string;
}

interface Store {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  location?: string;
  location_text?: string;
  address?: string;
  openTime?: string;
  open_time?: string;
  rating?: number;
  categories?: string[];
  category?: string;
  hasOffers?: boolean;
  has_offers?: boolean;
  distance?: number;
  products?: Product[];
  owner_id?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: [number, number];
  contact_phone?: string;
  phone?: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonImg,
    IonSkeletonText,
    IonSpinner,
    IonBadge,
    IonChip,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class MapPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('productBottomSheet') productBottomSheet!: ElementRef;
  
  private markers: any[] = [];
  private subscriptions: Subscription[] = [];
  
  isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isBottomSheetActive = false;
  isProductSheetActive = false;
  isAuthenticated = false;
  currentUser: any = null;
  isLoading = true;
  
  stores: Store[] = [];
  selectedStore: Store | null = null;
  storeProducts: Product[] = [];
  searchQuery: string = '';

  private leafletMap: L.Map | null = null;
  private leafletMarkers: L.Marker[] = [];

  // Tiles globales para poder acceder a ellos desde cualquier método
  private lightTileLayer: L.TileLayer | null = null;
  private darkTileLayer: L.TileLayer | null = null;
  private currentTileLayer: L.TileLayer | null = null;

  @HostListener('window:matchMedia')
  onColorSchemeChange() {
    const newColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (this.isDarkTheme !== newColorScheme) {
      this.isDarkTheme = newColorScheme;
      this.updateThemeClasses();
      
      // Actualizar el tile layer del mapa y los marcadores
      this.updateMapTileLayer();
      
      // Forzar la actualización de los componentes de interfaz después del cambio de tema
      setTimeout(() => {
        if (this.leafletMap) {
          this.leafletMap.invalidateSize();
        }
      }, 300);
    }
  }

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router,
    private supabaseService: SupabaseService
  ) {
    addIcons({
      locationOutline,
      timeOutline,
      star,
      storefrontOutline,
      closeOutline,
      chevronBack,
      share,
      cartOutline,
      callOutline,
      checkmarkCircle,
      closeCircle,
      pricetagOutline,
      arrowForward,
      time: timeSharp,
      cart: cartSharp,
      location: locationSharp
    });
    
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        this.isAuthenticated = !!user;
        this.currentUser = user;
      })
    );

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkTheme = e.matches;
    });
  }

  async ngOnInit() {
    this.detectSystemTheme();
    await this.loadStoresFromDatabase();
  }

  ngAfterViewInit() {
    this.platform.ready().then(() => {
      this.initLeafletMap();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private createCustomMarkerIcon(store: Store): L.DivIcon {
    // URL de la imagen (usar la imagen de la tienda o una imagen por defecto)
    const imageUrl = store.imageUrl || store.image_url || 'assets/store-placeholder.jpg';
    
    // Color del marcador según si la tienda está abierta o cerrada
    const markerColor = store.isOpen 
      ? (this.isDarkTheme ? 'var(--marker-color-open-dark)' : 'var(--marker-color-open-light)') 
      : (this.isDarkTheme ? 'var(--marker-color-closed-dark)' : 'var(--marker-color-closed-light)');
    
    // Crear el HTML para el marcador con SVG e imagen
    const markerHtml = `
      <div class="custom-marker ${store.isOpen ? 'open' : 'closed'}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 82" width="40" height="40">
          <defs>
            <clipPath id="marker-clip-${store.id}">
              <circle cx="30" cy="25" r="17" />
            </clipPath>
          </defs>
          <path 
            d="M30,3.5c14.1,0,25.5,11.4,25.5,25.5c0,14.1-12.5,28.8-25.5,53.5C17,57.8,4.5,43.1,4.5,29C4.5,14.9,15.9,3.5,30,3.5z" 
            fill="${markerColor}" 
            stroke="${this.isDarkTheme ? 'var(--marker-border-color-dark)' : 'var(--marker-border-color-light)'}"
            stroke-width="2"
          />
          <!-- Círculo blanco interior para la imagen -->
          <circle cx="30" cy="25" r="17" fill="white" />
          <!-- Imagen de la tienda recortada en círculo -->
          <foreignObject x="13" y="8" width="34" height="34" clip-path="url(#marker-clip-${store.id})">
            <div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background-size: cover; background-position: center; background-image: url('${imageUrl}');">
            </div>
          </foreignObject>
        </svg>
      </div>
    `;
    
    // Crear un div icon con el HTML generado
    return L.divIcon({
      html: markerHtml,
      className: 'custom-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -35]
    });
  }

  private addStoreMarkersToMap() {
    if (!this.leafletMap) return;
    // Eliminar marcadores previos
    this.leafletMarkers.forEach(marker => marker.remove());
    this.leafletMarkers = [];
    
    // Añadir un marcador por cada tienda con coordenadas
    this.stores.forEach(store => {
      if (store.coordinates && Array.isArray(store.coordinates) && store.coordinates.length === 2) {
        // Crear un icono personalizado con la imagen de la tienda
        const customMarkerIcon = this.createCustomMarkerIcon(store);
        
        const marker = L.marker([store.coordinates[1], store.coordinates[0]], {
          icon: customMarkerIcon,
          title: store.name
        });
        marker.addTo(this.leafletMap!);
        
        // Crear el popup pero no vincularlo todavía
        const popup = L.popup().setContent(
          `<div class="marker-popup">
            <b>${store.name}</b>
            ${store.address ? `<p>${store.address}</p>` : ''}
            <button class='leaflet-popup-btn' data-store-id='${store.id}'>Ver tienda</button>
          </div>`
        );

        // Manejar el clic en el marcador
        marker.on('click', () => {
          // Calcular la posición centrada con offset
          const offsetY = this.isBottomSheetActive ? this.getMapOffset() : 0;
          const targetLatLng = marker.getLatLng();
          const targetPoint = this.leafletMap!.project(targetLatLng, this.leafletMap!.getZoom()).subtract([0, offsetY/2]);
          const newLatLng = this.leafletMap!.unproject(targetPoint, this.leafletMap!.getZoom());
          
          // Centrar el mapa con una animación más rápida
          this.leafletMap?.flyTo(newLatLng, 16, {
            duration: 0.75,
            easeLinearity: 0.5
          });

          // Abrir el popup inmediatamente
          marker.bindPopup(popup).openPopup();
          
          // Configurar el botón del popup después de abrirlo
          setTimeout(() => {
            const btn = document.querySelector(`button[data-store-id="${store.id}"]`);
            if (btn) {
              btn.addEventListener('click', () => this.selectStoreFromMap(store));
            }
          }, 0);
        });

        this.leafletMarkers.push(marker);
      }
    });
  }

  // Actualizar también los métodos de selección para usar la misma velocidad
  private selectStoreFromMap(store: Store) {
    this.selectedStore = store;
    this.loadStoreProducts(store.id);
    this.showProductSheet();
    this.isBottomSheetActive = true;
    
    if (this.leafletMap && store.coordinates && Array.isArray(store.coordinates) && store.coordinates.length === 2) {
      const offsetY = this.isBottomSheetActive ? this.getMapOffset() : 0;
      const targetLatLng = L.latLng(store.coordinates[1], store.coordinates[0]);
      const targetPoint = this.leafletMap.project(targetLatLng, this.leafletMap.getZoom()).subtract([0, offsetY/2]);
      const newLatLng = this.leafletMap.unproject(targetPoint, this.leafletMap.getZoom());
      
      this.leafletMap.flyTo(newLatLng, 16, {
        duration: 0.75,
        easeLinearity: 0.5
      });
      
      const marker = this.leafletMarkers.find(m => {
        const latlng = m.getLatLng();
        return latlng.lat === store.coordinates![1] && latlng.lng === store.coordinates![0];
      });
      if (marker) {
        marker.openPopup();
      }
    }
  }

  selectStore(store: Store) {
    this.selectedStore = store;
    this.loadStoreProducts(store.id);
    this.showProductSheet();
    this.isBottomSheetActive = true;
    
    if (this.leafletMap && store.coordinates && Array.isArray(store.coordinates) && store.coordinates.length === 2) {
      const offsetY = this.isBottomSheetActive ? this.getMapOffset() : 0;
      const targetLatLng = L.latLng(store.coordinates[1], store.coordinates[0]);
      const targetPoint = this.leafletMap.project(targetLatLng, this.leafletMap.getZoom()).subtract([0, offsetY/2]);
      const newLatLng = this.leafletMap.unproject(targetPoint, this.leafletMap.getZoom());
      
      this.leafletMap.flyTo(newLatLng, 16, {
        duration: 0.75,
        easeLinearity: 0.5
      });
      
      const marker = this.leafletMarkers.find(m => {
        const latlng = m.getLatLng();
        return latlng.lat === store.coordinates![1] && latlng.lng === store.coordinates![0];
      });
      if (marker) {
        marker.openPopup();
      }
    }
  }

  private async loadStoresFromDatabase() {
    try {
      this.isLoading = true;
      const storesData = await this.supabaseService.getStores();
      this.stores = storesData.map(store => {
        const isOpenNow = this.checkIfStoreIsOpen(store.open_time);
        return {
          ...store,
          coordinates: store.latitude && store.longitude ? [store.longitude, store.latitude] : [-0.376, 39.469],
          isOpen: isOpenNow,
          phone: store.contact_phone,
          distance: this.calculateRandomDistance()
        };
      });
      this.addStoreMarkersToMap();
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateRandomDistance(): number {
    return parseFloat((Math.random() * 4.9 + 0.1).toFixed(1));
  }

  private checkIfStoreIsOpen(openTime?: string): boolean {
    if (!openTime) return false;
    const now = new Date();
    const hour = now.getHours();
    const times = openTime.split(' - ');
    if (times.length !== 2) return false;
    const openHour = parseInt(times[0].split(':')[0], 10);
    const closeHour = parseInt(times[1].split(':')[0], 10);
    return hour >= openHour && hour < closeHour;
  }

  toggleBottomSheet() {
    this.isBottomSheetActive = !this.isBottomSheetActive;
    if (!this.isBottomSheetActive) {
      this.hideProductSheet();
    }
    if (this.leafletMap) {
      setTimeout(() => this.leafletMap!.invalidateSize(), 300);
    }
  }

  async loadStoreProducts(storeId: string) {
    try {
      this.isLoading = true;
      this.storeProducts = [];
      const products = await this.supabaseService.getStoreProducts(storeId);
      this.storeProducts = products;
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      this.isLoading = false;
    }
  }

  showProductSheet() {
    this.isProductSheetActive = true;
    if (this.leafletMap) {
      setTimeout(() => this.leafletMap!.invalidateSize(), 300);
    }
  }

  hideProductSheet() {
    this.isProductSheetActive = false;
    if (this.leafletMap) {
      setTimeout(() => this.leafletMap!.invalidateSize(), 300);
    }
  }

  onSearchInput(event: any) {
    const query = event.detail.value.toLowerCase();
    this.searchQuery = query;
    if (query) {
      this.filterStores(query);
    } else {
      this.loadStoresFromDatabase();
    }
  }

  private filterStores(query: string) {
    if (this.stores && this.stores.length > 0) {
      const filteredStores = this.stores.filter(store => 
        store.name.toLowerCase().includes(query) || 
        (store.category && store.category.toLowerCase().includes(query)) ||
        (store.description && store.description.toLowerCase().includes(query))
      );
      this.stores = filteredStores;
    }
  }

  viewStoreDetails(store: Store) {
    this.router.navigate(['/tabs/store', store.id]);
  }

  private detectSystemTheme() {
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkTheme = darkModeMediaQuery.matches;
      this.updateThemeClasses();
      
      const handleThemeChange = (e: MediaQueryListEvent) => {
        this.isDarkTheme = e.matches;
        this.updateThemeClasses();
        // Actualizar el tile layer y los marcadores
        this.updateMapTileLayer();
      };
      
      darkModeMediaQuery.addEventListener('change', handleThemeChange);
    }
  }

  private updateThemeClasses() {
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
    document.body.classList.toggle('light-theme', !this.isDarkTheme);
    
    const elements = [
      'ion-content',
      '.bottom-sheet',
      '.product-sheet',
      '.loading-overlay',
      '#map',
      '.store-item',
      '.store-details-card',
      '.search-section',
      '.stores-list',
      '.product-card'
    ];
    
    elements.forEach(selector => {
      const elementList = document.querySelectorAll(selector);
      elementList.forEach(element => {
        element.classList.toggle('dark-theme', this.isDarkTheme);
        element.classList.toggle('light-theme', !this.isDarkTheme);
      });
    });
    
    // Actualizar las variables CSS del documento
    document.documentElement.style.setProperty(
      '--ion-background-color', 
      this.isDarkTheme ? 'var(--color-bg-dark)' : 'var(--color-bg-light)'
    );
    document.documentElement.style.setProperty(
      '--ion-text-color', 
      this.isDarkTheme ? 'var(--color-text-dark)' : 'var(--color-text-light)'
    );
    document.documentElement.style.setProperty(
      '--ion-card-background', 
      this.isDarkTheme ? 'var(--color-card-dark)' : 'var(--color-card-light)'
    );
  }

  private initLeafletMap() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }

    // Crear el mapa
    const map = L.map('map').setView([39.469, -0.376], 14);
    
    // Definir ambos tile layers
    this.lightTileLayer = L.tileLayer(`https://api.maptiler.com/maps/dataviz/{z}/{x}/{y}.png?key=nd6CeZ7IspRMBLuVFPiI`, {
      attribution: '&copy; <a href=\"https://www.maptiler.com/copyright/\">MapTiler</a> &copy; OpenStreetMap contributors',
      maxZoom: 20
    });
    
    this.darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©CartoDB',
      maxZoom: 20
    });
    
    // Agregar el tile layer adecuado según el tema actual
    if (this.isDarkTheme) {
      this.darkTileLayer.addTo(map);
      this.currentTileLayer = this.darkTileLayer;
    } else {
      this.lightTileLayer.addTo(map);
      this.currentTileLayer = this.lightTileLayer;
    }
    
    this.leafletMap = map;
    this.addStoreMarkersToMap();

    setTimeout(() => {
      this.leafletMap!.invalidateSize();
    }, 300);
  }
  
  private updateMapTileLayer() {
    if (!this.leafletMap || !this.lightTileLayer || !this.darkTileLayer) {
      return;
    }
    
    // Si ya hay un tile layer, quitarlo primero
    if (this.currentTileLayer) {
      this.leafletMap.removeLayer(this.currentTileLayer);
    }
    
    // Agregar el nuevo tile layer según el tema actual
    if (this.isDarkTheme) {
      this.darkTileLayer.addTo(this.leafletMap);
      this.currentTileLayer = this.darkTileLayer;
    } else {
      this.lightTileLayer.addTo(this.leafletMap);
      this.currentTileLayer = this.lightTileLayer;
    }
    
    // Actualizar los marcadores para reflejar el cambio de tema
    this.updateMarkersForTheme();
  }
  
  private updateMarkersForTheme() {
    // Recrear los marcadores con el nuevo tema
    if (this.leafletMap && this.stores && this.stores.length > 0) {
      this.addStoreMarkersToMap();
    }
  }

  // Devuelve el offset vertical en píxeles para centrar el marcador por encima del bottom sheet
  private getMapOffset(): number {
    // Usa el 30% de la altura de la ventana como offset (ajustable)
    return window.innerHeight * 0.3;
  }

  handleImageError(event: any) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/store-placeholder.jpg';
  }

  shareStore() {
    // Implementar compartir tienda
    console.log('Compartir tienda:', this.selectedStore?.name);
  }

  goToCart() {
    // Implementar ir al carrito
    console.log('Ir al carrito');
  }
}