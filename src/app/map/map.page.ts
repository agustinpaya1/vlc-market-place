import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Platform, ToastController } from '@ionic/angular';
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
    compassOutline,
    locationOutline,
    locationSharp,
    pricetagOutline,
    share,
    star,
    storefrontOutline,
    timeOutline,
    timeSharp,
    checkmarkCircleOutline,
    alertCircleOutline
} from 'ionicons/icons';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { VlcoinService } from '../services/vlcoin.service';

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

interface Recompensa {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
  descripcion?: string;
  coins: number;
  tienda?: string;
  tiendaId?: string;
  tipo: 'descuento' | 'regalo' | 'experiencia';
  fechaCaducidad?: Date;
  distanciaAlUsuario?: number;
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

  // Variables para el Cazador de Oportunidades Locales
  modoCOLActivo = false;
  recompensas: Recompensa[] = [];
  marcadoresRecompensa: L.Marker[] = [];
  recompensaSeleccionada: Recompensa | null = null;
  recompensasCanjeadas: string[] = [];
  mostrarExplicacionCazador = false;

  private leafletMap: L.Map | null = null;
  private leafletMarkers: L.Marker[] = [];

  // Tiles globales para poder acceder a ellos desde cualquier método
  private lightTileLayer: L.TileLayer | null = null;
  private darkTileLayer: L.TileLayer | null = null;
  private currentTileLayer: L.TileLayer | null = null;

  private treasureIcon = L.icon({
    iconUrl: 'assets/col-icons/treasure-chest.svg',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'treasure-marker'
  });

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
    private supabaseService: SupabaseService,
    private vlcoinService: VlcoinService,
    private toastController: ToastController
  ) {
    addIcons({
      locationOutline,
      timeOutline,
      timeSharp,
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
      compassOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      location: locationSharp,
      cart: cartSharp,
      time: timeSharp
    });
    
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        const wasAuthenticated = this.isAuthenticated;
        this.isAuthenticated = !!user;
        this.currentUser = user;
        
        // Si el usuario ha cerrado sesión y tenía el modo Cazador activo, desactivarlo
        if (wasAuthenticated && !this.isAuthenticated && this.modoCOLActivo) {
          this.modoCOLActivo = false;
          this.desactivarModoCazador();
        }
      })
    );

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkTheme = e.matches;
    });

    // Inicializar recompensas
    this.inicializarRecompensas();
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

  // Métodos para el Cazador de Oportunidades Locales
  private inicializarRecompensas() {
    // Recompensas iniciales
    this.recompensas = [
      { 
        id: '1', 
        lat: 39.4702, 
        lng: -0.3768, 
        titulo: '2x1 en café solo hoy ☕', 
        descripcion: 'Presenta este cupón en Café Concierto y disfruta de 2 cafés por el precio de 1',
        coins: 10, 
        tienda: 'Café Concierto',
        tiendaId: 'cafe1',
        tipo: 'descuento'
      },
      { 
        id: '2', 
        lat: 39.4715, 
        lng: -0.3752, 
        titulo: '15% dto. en productos locales 🍊', 
        descripcion: 'Descuento aplicable en productos frescos del Mercado Central',
        coins: 15, 
        tienda: 'Mercado Central',
        tiendaId: 'mercado1',
        tipo: 'descuento'
      },
      { 
        id: '3', 
        lat: 39.4695, 
        lng: -0.3790, 
        titulo: 'Taller gratuito de cerámica 🏺', 
        descripcion: 'Participa en un taller de iniciación a la cerámica valenciana',
        coins: 25, 
        tienda: 'Artesanías Valencia',
        tiendaId: 'artesanias1',
        tipo: 'experiencia'
      },
      { 
        id: '4', 
        lat: 39.4675, 
        lng: -0.3760, 
        titulo: 'Pack gourmet gratis 🥘', 
        descripcion: 'Recoge tu pack de productos gourmet de regalo',
        coins: 30, 
        tienda: 'Gourmet Valencia',
        tiendaId: 'gourmet1',
        tipo: 'regalo'
      },
      { 
        id: '5', 
        lat: 39.4740, 
        lng: -0.3770, 
        titulo: 'Descubre el tesoro oculto 💰', 
        descripcion: 'Premio especial valorado en 100€ para los cazadores más rápidos',
        coins: 50, 
        tienda: 'Ayuntamiento',
        tiendaId: 'ayuntamiento1',
        tipo: 'regalo'
      }
    ];
  }

  toggleModoCOL() {
    // Solo permitir activar el cazador si el usuario está autenticado
    if (!this.isAuthenticated) {
      // Mostrar un mensaje para informar al usuario
      alert('Debes iniciar sesión para usar el Cazador de Oportunidades Locales');
      // Aquí podríamos redirigir al login si lo deseamos
      // this.router.navigate(['/login']);
      return;
    }
    
    if (!this.modoCOLActivo) {
      // Si vamos a activar el modo, primero mostramos la explicación
      this.mostrarExplicacionCazador = true;
    } else {
      // Si vamos a desactivar, lo hacemos directamente
      this.modoCOLActivo = false;
      this.desactivarModoCazador();
    }
  }

  cerrarExplicacionCazador() {
    this.mostrarExplicacionCazador = false;
    // Activar el modo cazador después de cerrar la explicación
    this.modoCOLActivo = true;
    this.activarModoCazador();
  }

  activarModoCazador() {
    // Verificar autenticación nuevamente por seguridad
    if (!this.isAuthenticated || !this.leafletMap) return;
    
    // Limpiar marcadores previos por si acaso
    this.desactivarModoCazador();
    
    // Añadir marcadores de recompensas al mapa
    this.recompensas.forEach((recompensa) => {
      // No mostrar recompensas ya canjeadas
      if (this.recompensasCanjeadas.includes(recompensa.id)) return;
      
      const marker = L.marker([recompensa.lat, recompensa.lng], {
        icon: this.treasureIcon
      });
      
      // Crear contenido HTML personalizado para el popup
      const popupContent = document.createElement('div');
      popupContent.className = 'col-popup-content';
      
      // Título
      const title = document.createElement('h3');
      title.textContent = recompensa.titulo;
      popupContent.appendChild(title);
      
      // Monedas
      const coins = document.createElement('p');
      coins.className = 'col-popup-coins';
      coins.textContent = `+${recompensa.coins} VLCoin`;
      popupContent.appendChild(coins);
      
      // Botón
      const button = document.createElement('button');
      button.className = 'col-popup-button';
      button.textContent = 'Ver recompensa';
      button.onclick = (e) => {
        e.stopPropagation();
        this.mostrarDetallesRecompensa(recompensa);
        this.leafletMap?.closePopup();
      };
      popupContent.appendChild(button);
      
      // Crear popup con opciones personalizadas
      const popup = L.popup({
        className: 'leaflet-popup-col-reward',
        closeButton: true,
        autoClose: true,
        closeOnClick: true
      }).setContent(popupContent);
      
      // Vincular el popup al marcador
      marker.bindPopup(popup);
      
      // Añadir un controlador de eventos para el clic en el marcador
      marker.on('click', () => {
        marker.openPopup();
      });
      
      marker.addTo(this.leafletMap!);
      this.marcadoresRecompensa.push(marker);
    });
  }

  desactivarModoCazador() {
    // Eliminar todos los marcadores de recompensas
    this.marcadoresRecompensa.forEach(marker => {
      marker.remove();
    });
    this.marcadoresRecompensa = [];
  }

  mostrarDetallesRecompensa(recompensa: Recompensa) {
    this.recompensaSeleccionada = recompensa;
    
    // Calcular y guardar la distancia para mostrarla en el popup
    if (this.leafletMap) {
      const centroMapa = this.leafletMap.getCenter();
      const distancia = this.calcularDistanciaEnMetros(
        centroMapa.lat, 
        centroMapa.lng, 
        recompensa.lat, 
        recompensa.lng
      );
      
      // Añadir la distancia a la recompensa seleccionada
      this.recompensaSeleccionada.distanciaAlUsuario = Math.round(distancia);
    }
  }

  cerrarPopupRecompensa() {
    this.recompensaSeleccionada = null;
  }

  canjearRecompensa(recompensa: Recompensa) {
    // Verificar que el usuario está suficientemente cerca
    if (!this.estaLoSuficientementeCerca(recompensa)) {
      alert('¡Estás demasiado lejos! Acércate a menos de 50 metros del tesoro para poder canjearlo.');
      return;
    }
    
    // Verificar que el usuario está autenticado
    if (!this.isAuthenticated || !this.currentUser || !this.currentUser.id) {
      alert('Debes iniciar sesión para canjear recompensas.');
      return;
    }
    
    // Añadir a la lista de recompensas canjeadas
    this.recompensasCanjeadas.push(recompensa.id);
    
    // Primero intentamos guardar el historial del canje
    this.guardarHistorialCanje(recompensa).then(historialGuardado => {
      // Luego añadimos las monedas al saldo del usuario
      this.vlcoinService.addVlcoins(this.currentUser.id, recompensa.coins)
        .then(async (success) => {
          if (success) {
            // Actualizar explícitamente el saldo para refrescar la UI
            await this.vlcoinService.getVlcoinBalance(this.currentUser.id);
            
            // Mostrar mensaje de éxito
            const toast = await this.toastController.create({
              message: `¡Has ganado ${recompensa.coins} VLCoin! Tu nuevo saldo se ha actualizado.`,
              duration: 3000,
              position: 'top',
              color: 'success',
              buttons: [
                {
                  text: 'OK',
                  role: 'cancel'
                }
              ]
            });
            await toast.present();
            
            // Alerta de éxito
            alert(`¡Enhorabuena! Has canjeado "${recompensa.titulo}" por ${recompensa.coins} VLCoin. 🎉`);
          } else {
            // Mostrar mensaje de error
            alert('Ha ocurrido un error al actualizar tu saldo. Por favor, inténtalo de nuevo.');
          }
        })
        .catch(error => {
          console.error('Error al añadir VLCoins:', error);
          alert('Ha ocurrido un error al actualizar tu saldo. Por favor, inténtalo de nuevo.');
        });
    }).catch(error => {
      console.error('Error al guardar historial de canje:', error);
      // Incluso si falla el historial, intentamos dar las monedas
      this.vlcoinService.addVlcoins(this.currentUser.id, recompensa.coins)
        .then(async (success) => {
          if (success) {
            // Asegurarnos de actualizar el saldo incluso en caso de error en el historial
            await this.vlcoinService.getVlcoinBalance(this.currentUser.id);
          }
        });
      alert(`¡Enhorabuena! Has canjeado "${recompensa.titulo}" por ${recompensa.coins} VLCoin. 🎉`);
    });
    
    // Actualizar marcadores si el modo cazador está activo
    if (this.modoCOLActivo) {
      this.desactivarModoCazador();
      this.activarModoCazador();
    }
    
    this.cerrarPopupRecompensa();
  }

  // Crear icono de marcador personalizado con la imagen de la tienda
  private createCustomMarkerIcon(store: Store): L.DivIcon {
    // URL de la imagen (usar la imagen de la tienda o una imagen por defecto)
    const imageUrl = store.image_url || 'assets/icons/store-default.png';
    const isOpen = this.checkIfStoreIsOpen(store.open_time);
    
    // Crear el HTML para el marcador personalizado
    const html = `
      <div class="custom-marker ${isOpen ? 'open' : 'closed'}">
        <div class="marker-base">
          <img src="assets/icons/pingas.png" class="marker-bg" alt="Marker" />
        </div>
        <div class="marker-image" style="background-image: url('${imageUrl}')"></div>
      </div>
    `;
    
    return L.divIcon({
      html: html,
      className: 'custom-marker-icon',
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
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
        // Crear un marcador con icono personalizado
        const customIcon = this.createCustomMarkerIcon(store);
        const marker = L.marker([store.coordinates[1], store.coordinates[0]], {
          icon: customIcon,
          title: store.name
        });
        
        marker.addTo(this.leafletMap!);
        
        // Crear el popup pero no vincularlo todavía
        const isOpen = this.checkIfStoreIsOpen(store.open_time);
        const popup = L.popup().setContent(
          `<div class="marker-popup">
            <div class="marker-popup-header">
              <h3>${store.name}</h3>
              <span class="status-badge ${isOpen ? 'open' : 'closed'}">
                ${isOpen ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
            <p>${store.category || 'Tienda local'}</p>
            ${store.address ? `<p><ion-icon name="location-outline"></ion-icon> ${store.address}</p>` : ''}
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
      console.log('Actualizando marcadores para el nuevo tema:', this.isDarkTheme ? 'oscuro' : 'claro');
      this.addStoreMarkersToMap();
    }
  }

  // Devuelve el offset vertical en píxeles para centrar el marcador por encima del bottom sheet
  private getMapOffset(): number {
    // Usa el 30% de la altura de la ventana como offset (ajustable)
    return window.innerHeight * 0.3;
  }

  // Calcular la distancia entre dos puntos geográficos en metros
  private calcularDistanciaEnMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distanciaKm = R * c; // Distancia en km
    return distanciaKm * 1000; // Convertir a metros
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  // Verificar si el usuario está lo suficientemente cerca de una recompensa (50 metros)
  private estaLoSuficientementeCerca(recompensa: Recompensa): boolean {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return false;
    }
    
    // Si estamos en modo desarrollo, permitir canjear desde cualquier lugar
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return true;
    }
    
    // Si la recompensa ya tiene calculada la distancia, usamos ese valor
    if (recompensa.distanciaAlUsuario !== undefined) {
      return recompensa.distanciaAlUsuario <= 50;
    }
    
    return false;
  }

  // Guardar un canje en el historial de recompensas del usuario
  private async guardarHistorialCanje(recompensa: Recompensa): Promise<boolean> {
    if (!this.currentUser || !this.currentUser.id) return false;
    
    try {
      const { error } = await this.supabaseService.getClient()
        .from('recompensas_canjeadas')
        .insert({
          user_id: this.currentUser.id,
          recompensa_id: recompensa.id,
          titulo: recompensa.titulo,
          tipo: recompensa.tipo,
          coins: recompensa.coins,
          latitud: recompensa.lat,
          longitud: recompensa.lng,
          tienda: recompensa.tienda || 'Tesoro del Cazador'
        });
        
      if (error) {
        console.error('Error al guardar historial de canje:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al guardar historial de canje:', error);
      return false;
    }
  }

  handleImageError(event: any) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/placeholder.png';
  }

  shareStore() {
    // Implementar compartir tienda
    console.log('Compartir tienda');
  }

  goToCart() {
    // Implementar ir al carrito
    console.log('Ir al carrito');
  }
}