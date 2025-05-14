import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Platform, ModalController } from '@ionic/angular';
import {
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonImg,
    IonSearchbar,
    IonSkeletonText,
    IonSpinner
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
import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { StorePage } from '../store/store.page';

declare var mapboxgl: any;
declare var Mapkick: any;

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
    StorePage
  ]
})
export class MapPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('productBottomSheet') productBottomSheet!: ElementRef;
  
  private map: any;
  private subscriptions: Subscription[] = [];
  private mapInitialized = false;
  private mapReady = new BehaviorSubject<boolean>(false);
  
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

  @HostListener('window:matchMedia')
  onColorSchemeChange() {
    const newColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (this.isDarkTheme !== newColorScheme) {
      this.isDarkTheme = newColorScheme;
    }
  }

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router,
    private supabaseService: SupabaseService,
    private ngZone: NgZone,
    private modalCtrl: ModalController
  ) {
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
    await this.loadMapboxScript();

    // Escuchar el evento viewStore del mapa
    document.addEventListener('viewStore', ((e: CustomEvent) => {
      const storeId = e.detail;
      const store = this.stores.find(s => s.id === storeId);
      if (store) {
        this.viewStoreDetails(store);
      }
    }) as EventListener);
  }

  private async loadMapboxScript(): Promise<void> {
    if (typeof mapboxgl !== 'undefined' && typeof Mapkick !== 'undefined') {
      this.mapReady.next(true);
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = async () => {
        const mapkickScript = document.createElement('script');
        mapkickScript.src = 'assets/js/mapkick.js';
        mapkickScript.onload = () => {
          console.log('Mapbox and Mapkick loaded successfully');
          this.ngZone.run(() => {
            this.mapReady.next(true);
            resolve();
          });
        };
        mapkickScript.onerror = (error) => {
          console.error('Error loading Mapkick:', error);
          reject(error);
        };
        document.body.appendChild(mapkickScript);
      };
      script.onerror = (error) => {
        console.error('Error loading Mapbox:', error);
        reject(error);
      };
      document.body.appendChild(script);
    });
  }

  ngAfterViewInit() {
    this.platform.ready().then(() => {
      this.mapReady.subscribe(ready => {
        if (ready && !this.mapInitialized) {
          this.initMap();
          this.mapInitialized = true;
        }
      });
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.map) {
      // Cleanup map resources
    }
  }

  // Método para manejar el evento viewStore
  private onViewStore = ((e: CustomEvent) => {
    const storeId = e.detail;
    const store = this.stores.find(s => s.id === storeId);
    if (store) {
      this.viewStoreDetails(store);
    }
  }) as EventListener;

  private async loadStoresFromDatabase() {
    try {
      this.isLoading = true;
      // Suscribirse a cambios en tiempo real de las tiendas
      const subscription = this.supabaseService.subscribeToStores().subscribe(
        (storesData) => {
          this.ngZone.run(() => {
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
            this.updateMapMarkers();
          });
        },
        (error) => {
          console.error('Error en la suscripción de tiendas:', error);
        }
      );

      // Añadir la suscripción al array de subscriptions para limpiarla después
      this.subscriptions.push(subscription);

    } catch (error) {
      console.error('Error al cargar tiendas:', error);
    } finally {
      this.ngZone.run(() => {
        this.isLoading = false;
      });
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
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 300);
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
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 300);
    }
  }

  hideProductSheet() {
    this.isProductSheetActive = false;
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 300);
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

  async viewStoreDetails(store: Store) {
    const modal = await this.modalCtrl.create({
      component: StorePage,
      componentProps: {
        storeId: store.id
      },
      breakpoints: [0, 0.25, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      backdropBreakpoint: 0.5,
      cssClass: 'store-modal',
      showBackdrop: true,
      backdropDismiss: true,
      handle: true,
      handleBehavior: "cycle"
    });

    await modal.present();
  }

  private detectSystemTheme() {
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkTheme = darkModeMediaQuery.matches;
      this.updateThemeClasses();
      const handleThemeChange = (e: MediaQueryListEvent) => {
        this.isDarkTheme = e.matches;
        this.updateThemeClasses();
      };
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleThemeChange);
      } else {
        darkModeMediaQuery.addListener(handleThemeChange);
      }
    } else {
      this.isDarkTheme = true;
      this.updateThemeClasses();
    }
  }

  private updateThemeClasses() {
    const content = document.querySelector('ion-content');
    if (content) {
      content.classList.toggle('dark-theme', this.isDarkTheme);
      content.classList.toggle('light-theme', !this.isDarkTheme);
    }
    const bottomSheet = document.querySelector('.bottom-sheet');
    if (bottomSheet) {
      bottomSheet.classList.toggle('dark-theme', this.isDarkTheme);
      bottomSheet.classList.toggle('light-theme', !this.isDarkTheme);
    }
    const productSheet = document.querySelector('.product-sheet');
    if (productSheet) {
      productSheet.classList.toggle('dark-theme', this.isDarkTheme);
      productSheet.classList.toggle('light-theme', !this.isDarkTheme);
    }
  }

  private initMap() {
    if (!mapboxgl || !Mapkick) {
      console.error('Mapbox or Mapkick not loaded');
      return;
    }

    try {
      this.ngZone.runOutsideAngular(() => {
        mapboxgl.accessToken = "pk.eyJ1IjoicGF5YWFndXN0aW4iLCJhIjoiY21hbnUweWQ0MDAxczJpc2NlZXVsb2hxZiJ9.ZYgOQNUhAST03VstNlgnCA";
        Mapkick.use(mapboxgl);
        
        // Función para obtener los datos del mapa
        const fetchMapData = async (success: (data: any[]) => void) => {
          try {
            const storesData = await this.supabaseService.getStores();
            const mapData = storesData.map(store => ({
              id: store.id, // Identificador único para cada tienda
              latitude: store.latitude || 39.469,
              longitude: store.longitude || -0.376,
              tooltip: this.generateTooltipHTML(store),
              color: this.checkIfStoreIsOpen(store.open_time) ? "#4CAF50" : "#FF5252",
              time: new Date() // Timestamp actual para tracking
            }));
            success(mapData);
          } catch (error) {
            console.error('Error fetching stores:', error);
          }
        };

        // Set global options for all maps
        Mapkick.options = {
          tooltips: {
            hover: false,
            html: true
          },
          style: "mapbox://styles/mapbox/streets-v12"
        };

        // Initialize map with live updates
        this.map = new Mapkick.Map("map", fetchMapData, {
          accessToken: mapboxgl.accessToken,
          zoom: 14,
          center: [-0.376, 39.469],
          controls: true,
          markers: {
            color: "#f84d4d"
          },
          refresh: 30, // Actualizar cada 30 segundos
          trail: {
            len: 5 // Mantener un histórico de 5 posiciones por tienda
          }
        });

        // Add click event listener to map
        if (this.map.getMapObject()) {
          this.map.getMapObject().on('click', 'objects', (e: any) => {
            const feature = e.features[0];
            if (feature) {
              const store = this.stores.find(s => 
                s.coordinates && 
                s.coordinates[1] === feature.geometry.coordinates[1] && 
                s.coordinates[0] === feature.geometry.coordinates[0]
              );
              if (store) {
                this.ngZone.run(() => {
                  this.selectStore(store);
                });
              }
            }
          });

          // Añadir eventos para interacción con el cursor
          this.map.getMapObject().on('mouseenter', 'objects', () => {
            this.map.getMapObject().getCanvas().style.cursor = 'pointer';
          });

          this.map.getMapObject().on('mouseleave', 'objects', () => {
            this.map.getMapObject().getCanvas().style.cursor = '';
          });
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private generateTooltipHTML(store: Store): string {
    return `
      <div class="map-tooltip">
        <div class="tooltip-header">
          <h3>${store.name}</h3>
          <span class="status ${store.isOpen ? 'open' : 'closed'}">
            ${store.isOpen ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
        <div class="tooltip-content">
          ${store.category ? `<p class="category">${store.category}</p>` : ''}
          ${store.address ? `<p class="address"><ion-icon name="location-outline"></ion-icon>${store.address}</p>` : ''}
          ${store.open_time ? `<p class="schedule"><ion-icon name="time-outline"></ion-icon>${store.open_time}</p>` : ''}
          ${store.rating ? `
            <div class="rating">
              <ion-icon name="star"></ion-icon>
              <span>${store.rating.toFixed(1)}</span>
            </div>
          ` : ''}
        </div>
        <button class="view-store-btn" onclick="document.dispatchEvent(new CustomEvent('viewStore', {detail: '${store.id}'}))">
          Ver tienda
        </button>
      </div>
    `;
  }

  private updateMapMarkers() {
    if (this.map && this.map.getMapObject()) {
      const mapData = this.stores.map(store => ({
        id: store.id,
        latitude: store.coordinates![1],
        longitude: store.coordinates![0],
        tooltip: this.generateTooltipHTML(store),
        color: store.isOpen ? "#4CAF50" : "#FF5252",
        time: new Date()
      }));
      
      this.map.getMapObject().getSource('objects').setData({
        type: 'FeatureCollection',
        features: mapData.map(point => ({
          type: 'Feature',
          id: point.id,
          geometry: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude]
          },
          properties: {
            tooltip: point.tooltip,
            icon: 'mapkick',
            color: point.color,
            time: point.time
          }
        }))
      });
    }
  }

  async selectStore(store: Store) {
    this.selectedStore = store;
    this.isBottomSheetActive = true;
    
    // Load store products
    await this.loadStoreProducts(store.id!);
    
    // Show product sheet
    this.showProductSheet();
    
    // Center map on selected store
    if (this.map && store.coordinates) {
      this.map.getMapObject().flyTo({
        center: store.coordinates,
        zoom: 16,
        duration: 1000
      });
    }
  }
}