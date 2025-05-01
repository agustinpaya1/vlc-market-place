import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSkeletonText,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  callOutline,
  cartOutline,
  checkmarkCircle,
  closeCircle,
  closeOutline,
  locationOutline,
  pricetagOutline,
  star,
  storefrontOutline,
  timeOutline
} from 'ionicons/icons';
import mapboxgl from 'mapbox-gl';
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
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonImg,
    IonSkeletonText,
    IonSpinner,
    IonBadge
  ]
})
export class MapPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('productBottomSheet') productBottomSheet!: ElementRef;
  
  private map!: mapboxgl.Map;
  private readonly mapboxToken = 'pk.eyJ1IjoianVhbmpvc2VydWl6IiwiYSI6ImNtOWlkdmdjYTAxNWIyanF3Mmg4NmJjeDkifQ.i1uWtbQazE35o9Vtyv_oBA';
  private markers: mapboxgl.Marker[] = [];
  private subscriptions: Subscription[] = [];
  
  // Detectar preferencia de tema del sistema
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

  // Escuchar cambios en la preferencia de tema del sistema
  @HostListener('window:matchMedia')
  onColorSchemeChange() {
    const newColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (this.isDarkTheme !== newColorScheme) {
      this.isDarkTheme = newColorScheme;
      this.updateMapStyle();
    }
  }

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router,
    private supabaseService: SupabaseService
  ) {
    // Añadir solo los iconos necesarios
    addIcons({
      locationOutline,
      timeOutline,
      callOutline,
      closeOutline,
      checkmarkCircle,
      closeCircle,
      storefrontOutline,
      cartOutline,
      pricetagOutline,
      arrowForward,
      star
    });
    
    console.log('Configurando token de Mapbox...');
    // Set Mapbox access token
    mapboxgl.accessToken = this.mapboxToken;
    console.log('Token configurado:', mapboxgl.accessToken);
    
    // Subscribe to authentication state
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        this.isAuthenticated = !!user;
        this.currentUser = user;
      })
    );

    // Escuchar cambios en la preferencia de tema del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkTheme = e.matches;
      this.updateMapStyle();
    });
  }

  async ngOnInit() {
    // Detectar preferencia de tema del sistema
    this.detectSystemTheme();
    
    // Verificar que Mapbox esté disponible
    this.checkMapboxAvailability();
    
    // Cargar datos desde Supabase
    await this.loadStoresFromDatabase();
  }

  ngAfterViewInit() {
    this.platform.ready().then(() => {
      console.log('Plataforma lista, inicializando mapa...');
      setTimeout(() => {
        try {
          this.initializeMap();
        } catch (error) {
          console.error('Error al inicializar el mapa:', error);
        }
      }, 500); // Un pequeño retraso para asegurar que el DOM está listo
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    
    // Desuscribirse de todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async loadStoresFromDatabase() {
    try {
      this.isLoading = true;
      const storesData = await this.supabaseService.getStores();
      
      // Mapear los datos a nuestro modelo
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
      
      console.log('Tiendas cargadas:', this.stores);
      
      // Inicializar el mapa si ya existe
      if (this.map) {
        this.addStoreMarkers();
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateRandomDistance(): number {
    // Simular distancia entre 0.1 y 5 km
    return parseFloat((Math.random() * 4.9 + 0.1).toFixed(1));
  }

  private checkIfStoreIsOpen(openTime?: string): boolean {
    if (!openTime) return false;
    
    // Implementación simple para determinar si la tienda está abierta
    const now = new Date();
    const hour = now.getHours();
    
    // Parsear horario (formato "8:00 - 20:00")
    const times = openTime.split(' - ');
    if (times.length !== 2) return false;
    
    const openHour = parseInt(times[0].split(':')[0], 10);
    const closeHour = parseInt(times[1].split(':')[0], 10);
    
    return hour >= openHour && hour < closeHour;
  }

  private initializeMap() {
    console.log('Inicializando mapa con contenedor mapbox-map...');
    const mapContainer = document.getElementById('mapbox-map');
    console.log('¿Existe el contenedor?', mapContainer !== null);
    
    if (!mapContainer) {
      console.error('El contenedor del mapa no existe en el DOM');
      return;
    }
    
    // Asegurarnos de que el token está configurado
    if (!mapboxgl.accessToken) {
      console.log('Configurando token de Mapbox en el componente...');
      mapboxgl.accessToken = this.mapboxToken;
    }
    
    console.log('Token actual:', mapboxgl.accessToken);
    
    // Determinar el estilo del mapa según preferencia del sistema
    const mapStyle = this.isDarkTheme ? 
      'mapbox://styles/mapbox/dark-v11' : 
      'mapbox://styles/mapbox/light-v11';
    
    console.log('Estilo del mapa seleccionado:', this.isDarkTheme ? 'oscuro' : 'claro');
    
    try {
      // Forzar estilos mínimos en el contenedor
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100%';
      
      this.map = new mapboxgl.Map({
        container: 'mapbox-map',
        style: mapStyle,
        center: [-0.376, 39.469], // Valencia coordinates
        zoom: 14,
        attributionControl: false,
        preserveDrawingBuffer: true
      });
      
      console.log('Mapa creado correctamente');

      // Add controls
      this.map.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        visualizePitch: false
      }), 'top-right');
      
      this.map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'top-right');

      // Add scale control
      this.map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

      // Wait for map to load
      this.map.on('load', () => {
        console.log('Mapa cargado, añadiendo atribución y marcadores...');
        this.addMapAttribution();
        this.addStoreMarkers();
        console.log('Mapa inicializado completamente');
      });

      // Listen for error events
      this.map.on('error', (e) => {
        console.error('Error en el mapa:', e.error);
      });

      // Add touch/gesture handling
      this.setupTouchHandling();
    } catch (error) {
      console.error('Error al crear el mapa:', error);
    }
  }

  private setupTouchHandling() {
    // Prevent map drag if touching the bottom sheet
    const bottomSheet = document.querySelector('.bottom-sheet');
    const productSheet = document.querySelector('.product-sheet');
    
    bottomSheet?.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    });
    
    productSheet?.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    });
  }

  private addMapAttribution() {
    if (!this.map) return;
    
    // Add custom attribution in a more visible format
    const attributionControl = new mapboxgl.AttributionControl({
      compact: true,
      customAttribution: 'Valencia Market Places'
    });
    
    this.map.addControl(attributionControl, 'bottom-left');
  }

  private addStoreMarkers() {
    if (!this.map) return;
    
    console.log('Añadiendo marcadores para', this.stores.length, 'tiendas');
    
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    
    // Add new markers for each store
    this.stores.forEach(store => {
      // Skip stores without coordinates
      if (!store.coordinates) {
        console.warn(`La tienda ${store.name} no tiene coordenadas válidas`);
        return;
      }
      
      // Create marker elements
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.setAttribute('data-store-id', store.id);
      
      // Add pulse animation element
      const pulseElement = document.createElement('div');
      pulseElement.className = `marker-pulse ${store.isOpen ? '' : 'closed'}`;
      markerElement.appendChild(pulseElement);
      
      // Add main dot element
      const dotElement = document.createElement('div');
      dotElement.className = `marker-dot ${store.isOpen ? '' : 'closed'}`;
      
      // Ajustar colores según tema
      if (this.isDarkTheme) {
        dotElement.style.setProperty('--marker-color-open', '#4befa3');
        dotElement.style.setProperty('--marker-color-closed', '#f97171');
        dotElement.style.setProperty('--marker-border-color', '#121212');
      } else {
        dotElement.style.setProperty('--marker-color-open', '#2da160');
        dotElement.style.setProperty('--marker-color-closed', '#d11e48');
        dotElement.style.setProperty('--marker-border-color', '#ffffff');
      }
      
      markerElement.appendChild(dotElement);
      
      // Create the marker
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat(store.coordinates)
        .addTo(this.map);
      
      // Add popup with store information
      const popupContent = document.createElement('div');
      popupContent.className = `store-popup-content ${this.isDarkTheme ? 'dark' : 'light'}`;
      popupContent.innerHTML = `
        <div class="store-popup-header">
          <strong>${store.name}</strong>
          <span class="status-badge ${store.isOpen ? 'open' : 'closed'}">
            ${store.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
          </span>
        </div>
        <div class="store-popup-info">
          ${store.category ? `<p class="category">${store.category}</p>` : ''}
          ${store.distance ? `<p><i class="icon">📍</i> ${store.distance} km</p>` : ''}
          ${store.open_time ? `<p><i class="icon">🕒</i> ${store.open_time}</p>` : ''}
        </div>
        <button class="view-store-btn" data-store-id="${store.id}">Ver detalles</button>
      `;
      
      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25,
        className: `store-popup ${this.isDarkTheme ? 'dark' : 'light'}`
      }).setDOMContent(popupContent);
      
      // Add event listener to the view details button
      popup.on('open', () => {
        const viewButton = document.querySelector(`.view-store-btn[data-store-id="${store.id}"]`);
        if (viewButton) {
          viewButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectStore(store);
            popup.remove();
          });
        }
      });
      
      // Show popup on hover for desktop
      markerElement.addEventListener('mouseenter', () => {
        marker.setPopup(popup);
        popup.addTo(this.map);
      });
      
      markerElement.addEventListener('mouseleave', () => {
        // Only remove popup if we're not on mobile
        if (window.innerWidth > 768) {
          popup.remove();
        }
      });
      
      // Handle marker click - select store
      markerElement.addEventListener('click', () => {
        // On mobile, show popup first
        if (window.innerWidth <= 768) {
          marker.setPopup(popup);
          popup.addTo(this.map);
        } else {
          // On desktop, directly select the store
          this.selectStore(store);
        }
      });
      
      // Store the marker reference
      this.markers.push(marker);
    });
  }

  toggleBottomSheet() {
    this.isBottomSheetActive = !this.isBottomSheetActive;
    
    // If closing bottom sheet, also close product sheet
    if (!this.isBottomSheetActive) {
      this.hideProductSheet();
    }
  }

  selectStore(store: Store) {
    this.selectedStore = store;
    
    // Highlight selected store marker
    const marker = this.findMarkerForStore(store);
    if (marker) {
      // Remove selected class from all markers
      this.markers.forEach(m => {
        const el = m.getElement();
        el.classList.remove('selected');
      });
      
      // Add selected class to current marker
      const el = marker.getElement();
      el.classList.add('selected');
      
      // Center map on store with animation
      this.map?.flyTo({
        center: store.coordinates as [number, number],
        zoom: 15,
        duration: 800
      });
    }
    
    // Show product sheet
    this.loadStoreProducts(store.id);
    this.showProductSheet();
    
    // Always ensure bottom sheet is visible
    this.isBottomSheetActive = true;
  }
  
  private findMarkerForStore(store: Store): mapboxgl.Marker | undefined {
    if (!store.coordinates) return undefined;
    
    return this.markers.find(marker => {
      const lngLat = marker.getLngLat();
      return lngLat.lng === store.coordinates![0] && lngLat.lat === store.coordinates![1];
    });
  }

  async loadStoreProducts(storeId: string) {
    try {
      this.isLoading = true;
      this.storeProducts = [];
      
      // Cargar productos de la tienda
      const products = await this.supabaseService.getStoreProducts(storeId);
      
      this.storeProducts = products;
      console.log('Productos cargados:', this.storeProducts);
      
      // Activar el panel de productos
      this.showProductSheet();
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      this.isLoading = false;
    }
  }

  showProductSheet() {
    this.isProductSheetActive = true;
  }

  hideProductSheet() {
    this.isProductSheetActive = false;
  }

  onSearchInput(event: any) {
    const query = event.detail.value.toLowerCase();
    this.searchQuery = query;
    
    // Filter stores based on search query
    if (query) {
      this.filterStores(query);
    } else {
      // Reload all stores if search is cleared
      this.loadStoresFromDatabase();
    }
  }

  private filterStores(query: string) {
    // Only show stores that match the search query
    if (this.stores && this.stores.length > 0) {
      const filteredStores = this.stores.filter(store => 
        store.name.toLowerCase().includes(query) || 
        (store.category && store.category.toLowerCase().includes(query)) ||
        (store.description && store.description.toLowerCase().includes(query))
      );
      
      // Update markers on map
      this.markers.forEach(marker => {
        const markerEl = marker.getElement();
        markerEl.style.display = 'none';
      });
      
      // Show only filtered markers
      filteredStores.forEach(store => {
        const marker = this.findMarkerForStore(store);
        if (marker) {
          const markerEl = marker.getElement();
          markerEl.style.display = 'block';
        }
      });
      
      // Update the stores list
      this.stores = filteredStores;
    }
  }

  viewStoreDetails(store: Store) {
    this.router.navigate(['/tabs/stores', store.id]);
  }

  // Método para verificar la disponibilidad de Mapbox
  private checkMapboxAvailability() {
    console.log('Verificando disponibilidad de Mapbox...');
    console.log('mapboxgl está disponible:', typeof mapboxgl !== 'undefined');
    
    if (typeof mapboxgl === 'undefined') {
      console.error('Mapbox GL no está disponible. Verifique la importación de la biblioteca.');
      this.showMapError('Error al cargar el mapa. Por favor, recarga la página.');
      return false;
    }
    
    if (!mapboxgl.supported()) {
      console.warn('Mapbox GL no es compatible con este navegador.');
      this.showMapError('Tu navegador no es compatible con el mapa 3D. Para mejor experiencia, usa Chrome o Firefox actualizado.');
      return false;
    }
    
    return true;
  }

  // Mostrar error en el mapa
  private showMapError(message: string) {
    const mapContainer = document.getElementById('mapbox-map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #121212; color: white; text-align: center; padding: 20px;">
          <div>
            <h2>Problema con el mapa</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #3880ff; border: none; color: white; border-radius: 4px; margin-top: 10px;">Reintentar</button>
          </div>
        </div>
      `;
    }
  }

  // Método para actualizar el estilo del mapa cuando cambian las preferencias del sistema
  private updateMapStyle() {
    if (!this.map) return;
    
    const newStyle = this.isDarkTheme ? 
      'mapbox://styles/mapbox/dark-v11' : 
      'mapbox://styles/mapbox/light-v11';
    
    console.log('Actualizando estilo del mapa a:', this.isDarkTheme ? 'oscuro' : 'claro');
    this.map.setStyle(newStyle);
    
    // Re-añadir marcadores cuando el estilo cambie
    this.map.once('style.load', () => {
      this.addStoreMarkers();
    });
  }

  // Detectar tema del sistema y actualizarlo
  private detectSystemTheme() {
    // Verificar si el navegador soporta la API de preferencia de tema
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Obtener preferencia actual
      this.isDarkTheme = darkModeMediaQuery.matches;
      
      // Escuchar cambios en la preferencia
      const handleThemeChange = (e: MediaQueryListEvent) => {
        this.isDarkTheme = e.matches;
        this.updateMapStyle();
      };
      
      // Usar addEventListener si está disponible (más moderno)
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleThemeChange);
      } else {
        // Fallback para navegadores antiguos
        darkModeMediaQuery.addListener(handleThemeChange);
      }
      
      console.log('Preferencia de tema detectada:', this.isDarkTheme ? 'oscuro' : 'claro');
    } else {
      // Fallback a tema oscuro por defecto
      this.isDarkTheme = true;
      console.log('Detección de tema no soportada, usando tema oscuro por defecto');
    }
  }
}