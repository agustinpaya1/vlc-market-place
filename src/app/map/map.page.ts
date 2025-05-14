import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
    compassOutline,
    locationOutline,
    pricetagOutline,
    star,
    storefrontOutline,
    timeOutline,
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

  // Variables para el Cazador de Oportunidades Locales
  modoCOLActivo = false;
  recompensas: Recompensa[] = [];
  marcadoresRecompensa: L.Marker[] = [];
  recompensaSeleccionada: Recompensa | null = null;
  recompensasCanjeadas: string[] = [];

  private leafletMap: L.Map | null = null;
  private leafletMarkers: L.Marker[] = [];

  private customIcon = L.icon({
    iconUrl: 'assets/map-icons/custom-marker.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

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
      callOutline,
      closeOutline,
      checkmarkCircle,
      closeCircle,
      storefrontOutline,
      cartOutline,
      pricetagOutline,
      arrowForward,
      star,
      compassOutline,
      checkmarkCircleOutline,
      alertCircleOutline
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
        lat: 39.4680, 
        lng: -0.3745, 
        titulo: 'Degustación de horchata gratis 🥛', 
        descripcion: 'Ven a probar la mejor horchata tradicional valenciana',
        coins: 5, 
        tienda: 'Horchatería El Turia',
        tiendaId: 'horchata1',
        tipo: 'regalo'
      }
    ];
    
    // Generar recompensas aleatorias adicionales basadas en tiendas
    setTimeout(() => {
      if (this.stores.length > 0) {
        this.stores.forEach((store, index) => {
          if (store.coordinates && Math.random() > 0.6) { // 40% de probabilidad
            const tipoRecompensa = ['descuento', 'regalo', 'experiencia'][Math.floor(Math.random() * 3)] as 'descuento' | 'regalo' | 'experiencia';
            let titulo = '';
            let coins = Math.floor(Math.random() * 20) + 5;
            
            if (tipoRecompensa === 'descuento') {
              const porcentaje = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
              titulo = `${porcentaje}% descuento en ${store.name}`;
            } else if (tipoRecompensa === 'regalo') {
              titulo = `Regalo sorpresa en ${store.name}`;
            } else {
              titulo = `Experiencia VIP en ${store.name}`;
              coins += 10; // Las experiencias dan más monedas
            }
            
            this.recompensas.push({
              id: `tienda-${store.id}-${Date.now()}`,
              lat: store.coordinates[1] + (Math.random() * 0.002 - 0.001), // Pequeña variación
              lng: store.coordinates[0] + (Math.random() * 0.002 - 0.001), // Pequeña variación
              titulo,
              coins,
              tienda: store.name,
              tiendaId: store.id,
              tipo: tipoRecompensa
            });
          }
        });
      }
    }, 2000);
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
    
    this.modoCOLActivo = !this.modoCOLActivo;
    
    if (this.modoCOLActivo) {
      this.activarModoCazador();
    } else {
      this.desactivarModoCazador();
    }
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

  private addStoreMarkersToMap() {
    if (!this.leafletMap) return;
    // Eliminar marcadores previos
    this.leafletMarkers.forEach(marker => marker.remove());
    this.leafletMarkers = [];
    // Añadir un marcador por cada tienda con coordenadas
    this.stores.forEach(store => {
      if (store.coordinates && Array.isArray(store.coordinates) && store.coordinates.length === 2) {
        const marker = L.marker([store.coordinates[1], store.coordinates[0]], {
          icon: this.customIcon,
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
            duration: 0.75, // Reducido de 1.5 a 0.75 segundos
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
    L.tileLayer('https://api.maptiler.com/maps/dataviz/{z}/{x}/{y}.png?key=nd6CeZ7IspRMBLuVFPiI', {
      attribution: '&copy; <a href=\"https://www.maptiler.com/copyright/\">MapTiler</a> &copy; OpenStreetMap contributors',
      maxZoom: 20
    }).addTo(map);
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
    if (!this.leafletMap) return false;
    
    // Obtener la posición actual del mapa como aproximación a la ubicación del usuario
    const centroMapa = this.leafletMap.getCenter();
    const distancia = this.calcularDistanciaEnMetros(
      centroMapa.lat, 
      centroMapa.lng, 
      recompensa.lat, 
      recompensa.lng
    );
    
    console.log(`Distancia a la recompensa: ${distancia.toFixed(2)} metros`);
    return distancia <= 50; // 50 metros máximo
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
}