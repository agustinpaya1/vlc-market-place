import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
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
    IonSearchbar,
    IonImg,
    IonSkeletonText,
    IonSpinner,
    IonBadge
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
    private supabaseService: SupabaseService
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
  }

  ngAfterViewInit() {
    this.platform.ready().then(() => {
      this.initLeafletMap();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private addStoreMarkersToMap() {
    if (!this.leafletMap) return;
    // Eliminar marcadores previos
    this.leafletMarkers.forEach(marker => marker.remove());
    this.leafletMarkers = [];
    // Añadir un marcador por cada tienda con coordenadas
    this.stores.forEach(store => {
      if (store.coordinates && Array.isArray(store.coordinates) && store.coordinates.length === 2) {
        const marker = L.marker([store.coordinates[1], store.coordinates[0]]);
        marker.addTo(this.leafletMap!);
        // Popup con botón para ver tienda
        marker.bindPopup(
          `<b>${store.name}</b><br><button class='leaflet-popup-btn' data-store-id='${store.id}'>Ver tienda</button>`
        );
        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.querySelector(`.leaflet-popup-btn[data-store-id='${store.id}']`);
            if (btn) {
              btn.addEventListener('click', () => {
                this.selectStoreFromMap(store);
              });
            }
          }, 0);
        });
        this.leafletMarkers.push(marker);
      }
    });
  }

  // Nueva función para seleccionar tienda desde el mapa
  private selectStoreFromMap(store: Store) {
    this.selectedStore = store;
    this.loadStoreProducts(store.id);
    this.showProductSheet();
    this.isBottomSheetActive = true;
    // Centrar el mapa en la tienda con offset vertical
    if (this.leafletMap && store.coordinates && Array.isArray(store.coordinates) && store.coordinates.length === 2) {
      const offsetY = this.isBottomSheetActive ? this.getMapOffset() : 0;
      const targetLatLng = L.latLng(store.coordinates[1], store.coordinates[0]);
      const targetPoint = this.leafletMap.project(targetLatLng, this.leafletMap.getZoom()).subtract([0, offsetY]);
      const newLatLng = this.leafletMap.unproject(targetPoint, this.leafletMap.getZoom());
      this.leafletMap.setView(newLatLng, 16, { animate: true });
      // Abrir el popup del marcador correspondiente
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
    // Centrar el mapa en la tienda con offset vertical
    if (this.leafletMap && store.coordinates && Array.isArray(store.coordinates) && store.coordinates.length === 2) {
      const offsetY = this.isBottomSheetActive ? this.getMapOffset() : 0;
      const targetLatLng = L.latLng(store.coordinates[1], store.coordinates[0]);
      const targetPoint = this.leafletMap.project(targetLatLng, this.leafletMap.getZoom()).subtract([0, offsetY]);
      const newLatLng = this.leafletMap.unproject(targetPoint, this.leafletMap.getZoom());
      this.leafletMap.setView(newLatLng, 16, { animate: true });
      // Abrir el popup del marcador correspondiente
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
    this.router.navigate(['/tabs/stores', store.id]);
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

  private initLeafletMap() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
    const map = L.map('map').setView([39.469, -0.376], 14);
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    osm.addTo(map);
    this.leafletMap = map;
    this.addStoreMarkersToMap();

    setTimeout(() => {
      this.leafletMap!.invalidateSize();
    }, 300);
  }

  // Devuelve el offset vertical en píxeles para centrar el marcador por encima del bottom sheet
  private getMapOffset(): number {
    // Usa el 30% de la altura de la ventana como offset (ajustable)
    return window.innerHeight * 0.3;
  }
}