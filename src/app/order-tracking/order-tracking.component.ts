import { Component, OnInit, AfterViewInit, OnDestroy, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ModalController, NavController } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonProgressBar,
  IonSpinner,
  IonText,
  IonItem,
  IonList,
  IonLabel,
  IonBadge
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { DeliverySuccessModalComponent } from '../delivery-success-modal/delivery-success-modal.component';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { addIcons } from 'ionicons';
import { 
  locationOutline, 
  bicycle, 
  timer, 
  checkmarkOutline,
  checkmarkCircle,
  storefront,
  home,
  arrowBack
} from 'ionicons/icons';

interface Order {
  id: string;
  user_id: string;
  total_price: number;
  status: 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at?: string;
  estimated_delivery_time?: string;
  current_location?: string;
  delivery_progress?: number;
  vlcoin_used?: number;
  store_id?: string;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
}

interface DeliveryStep {
  title: string;
  completed: boolean;
  icon: string;
}

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonProgressBar,
    IonSpinner,
    IonText,
    IonItem,
    IonList,
    IonLabel,
    IonBadge
  ],
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef;
  
  @Input() orderId: string = '';
  
  order: Order | null = null;
  leafletMap: L.Map | null = null;
  routingControl: any = null;
  
  // Propiedades para el mapa
  storeLocation: L.LatLng | null = null;
  deliveryLocation: L.LatLng | null = null;
  currentLocation: L.LatLng | null = null;
  mapInitialized: boolean = false;
  
  // Temporizador para actualización automática
  autoUpdateTimer: any = null;
  isAutoUpdateEnabled: boolean = true;
  
  // Ubicaciones para la demostración
  // storeLocation: L.LatLng = L.latLng(39.471, -0.376); // Valencia
  // deliveryLocation: L.LatLng = L.latLng(39.478, -0.37);  // Un punto cercano
  
  // Información para el seguimiento
  orderStatus: string = 'pending';
  deliveryProgress: number = 0;
  estimatedTime: string = '';
  estimatedDistance: string = '';
  currentDeliveryLocation: string = 'Tienda';
  deliverySteps: DeliveryStep[] = [
    { title: 'Pedido recibido', completed: false, icon: 'checkmark-outline' },
    { title: 'En preparación', completed: false, icon: 'timer' },
    { title: 'En camino', completed: false, icon: 'bicycle' },
    { title: 'Entregado', completed: false, icon: 'location-outline' }
  ];
  
  loading: boolean = true;
  error: string = '';
  
  // Objeto location para ser usado en la plantilla
  get location() {
    return window.location;
  }
  
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) {
    // Registrar iconos
    addIcons({
      'location-outline': locationOutline,
      'bicycle': bicycle,
      'timer': timer,
      'checkmark-outline': checkmarkOutline,
      'checkmark-circle': checkmarkCircle,
      'storefront': storefront,
      'home': home,
      'arrow-back': arrowBack
    });
  }
  
  async ngOnInit() {
    // Determinar si las actualizaciones automáticas están habilitadas (por defecto sí)
    this.isAutoUpdateEnabled = true;
    
    // Iniciar sesión de Supabase directamente para prevenir errores de bloqueo
    await this.initializeSession();
    
    // Sistema resiliente para recuperar el ID del pedido de múltiples fuentes
    this.tryGetOrderId();
  }
  
  /**
   * Método ultra-resiliente para recuperar el ID del pedido de múltiples fuentes posibles
   * En orden de prioridad: URL params, query params, session storage, local storage
   */
  private tryGetOrderId(): void {
    console.log('TRACKING: Intentando recuperar ID de pedido...');
    let foundId = false;
    
    // 1. Intentar obtener de los parámetros de ruta
    this.route.params.subscribe(params => {
      const paramId = params['id'];
      if (paramId) {
        console.log('TRACKING: ID encontrado en params de URL:', paramId);
        this.orderId = paramId;
        foundId = true;
        this.processOrderId();
      } else {
        // 2. Intentar obtener de los query params (si se usaron en la navegación)
        this.route.queryParams.subscribe(qParams => {
          const queryId = qParams['orderId'] || qParams['id'];
          if (queryId) {
            console.log('TRACKING: ID encontrado en query params:', queryId);
            this.orderId = queryId;
            foundId = true;
            this.processOrderId();
          } else {
            this.tryAlternativeSources();
          }
        });
      }
    });
  }
  
  /**
   * Busca el ID del pedido en fuentes alternativas como sessionStorage
   */
  private tryAlternativeSources(): void {
    console.log('TRACKING: Buscando ID en fuentes alternativas...');
    
    // 3. Intentar recuperar de sessionStorage
    const sessionId = sessionStorage.getItem('lastOrderId');
    if (sessionId) {
      console.log('TRACKING: ID encontrado en sessionStorage:', sessionId);
      this.orderId = sessionId;
      this.processOrderId();
      return;
    }
    
    // 4. Intentar recuperar de localStorage
    const localId = localStorage.getItem('lastOrderId');
    if (localId) {
      console.log('TRACKING: ID encontrado en localStorage:', localId);
      this.orderId = localId;
      this.processOrderId();
      return;
    }
    
    // 5. Si todo falla, mostrar error y opciones para recuperación
    console.error('TRACKING: No se pudo encontrar ID del pedido en ninguna fuente');
    this.error = 'No se pudo encontrar información del pedido. Por favor, compruebe sus pedidos recientes.';
    this.loading = false;
  }
  
  /**
   * Procesa el ID del pedido una vez encontrado
   */
  private processOrderId(): void {
    if (!this.orderId) return;
    
    console.log('TRACKING: Procesando orden con ID:', this.orderId);
    
    // Guardar en storage para futura referencia
    try {
      sessionStorage.setItem('lastOrderId', this.orderId);
      localStorage.setItem('lastOrderId', this.orderId);
    } catch (e) {
      console.warn('Error guardando ID en storage:', e);
    }
    
    // Iniciar carga
    this.loading = true;
    this.loadOrderDetails();
  }
  
  // Método para verificar autentificación de manera pasiva
  private async initializeSession(): Promise<void> {
    try {
      // Comprobamos si hay sesión activa sin intervenir en el proceso de autenticación
      const user = await this.authService.getCurrentUser();
      if (user) {
        console.log('Usuario autenticado correctamente para tracking');
      } else {
        console.log('No hay usuario autenticado para tracking, la información se comprobará al cargar el pedido');
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      // No bloqueamos la carga por errores de autenticación
    }
  }
  
  ngAfterViewInit() {
    // Retrasar la inicialización del mapa para asegurar que el DOM esté listo
    setTimeout(() => {
      console.log('Inicializando mapa después de timeout');
      if (this.mapElement && this.mapElement.nativeElement) {
        console.log('Elemento del mapa encontrado:', this.mapElement.nativeElement);
        this.initMap();
      } else {
        console.error('Elemento del mapa no disponible en ngAfterViewInit');
      }
    }, 1000);
  }
  
  ngOnDestroy() {
    // Eliminar el mapa
    if (this.leafletMap) {
      // Primero limpiar los controles si existen
      try {
        if (this.routingControl) {
          this.routingControl.getPlan().setWaypoints([]);
        }
      } catch (e) {
        console.warn('Error removing routing control', e);
      }
      
      try {
        if (this.leafletMap && this.routingControl) {
          this.leafletMap.removeControl(this.routingControl);
        }
      } catch (e) {
        console.warn('Error removing control de ruta:', e);
      }
    }
    
    // Detener el temporizador de actualización automática
    this.stopAutoUpdate();
  }
  
  async loadOrderDetails() {
    try {
      this.loading = true;
      
      if (!this.orderId) {
        throw new Error('ID de pedido no proporcionado');
      }
      
      // Obtener detalles del pedido de Supabase
      const { data, error } = await this.supabaseService.getClient()
        .from('orders')
        .select('*')
        .eq('id', this.orderId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Pedido no encontrado');
    
    this.order = data;
    
    // Actualizar datos del pedido
    if (this.order) {
      this.orderStatus = this.order.status || 'pending';
      this.deliveryProgress = this.order.delivery_progress || 0;
      
      // Coordenadas fijas de entrega por defecto
      let deliveryLat = 39.482686033242544;
      let deliveryLng = -0.346761123456372;
      let locationDescription = 'Punto de entrega';
      
      // Intentar obtener coordenadas del pedido (primera opción: current_location)
      if (this.order.current_location) {
        try {
          // Intenta parsear current_location como JSON
          const locationData = JSON.parse(this.order.current_location);
          
          // Si tiene coordenadas en formato [lat, lng], usarlas
          if (locationData && locationData.coordinates && 
              Array.isArray(locationData.coordinates) && 
              locationData.coordinates.length >= 2) {
            console.log('Usando coordenadas de current_location:', locationData.coordinates);
            deliveryLat = locationData.coordinates[0];
            deliveryLng = locationData.coordinates[1];
            
            // Si tiene descripción, usarla para la UI
            if (locationData.description) {
              locationDescription = locationData.description;
            }
          }
        } catch (e) {
          // Si no se puede parsear, usar current_location como texto descriptivo
          console.warn('current_location no es JSON válido:', e);
          locationDescription = this.order.current_location;
        }
      } 
      // Segunda opción: campos delivery_latitude y delivery_longitude
      else if (this.order.delivery_latitude !== undefined && this.order.delivery_longitude !== undefined) {
        console.log('Usando campos delivery_latitude/longitude:', [this.order.delivery_latitude, this.order.delivery_longitude]);
        deliveryLat = this.order.delivery_latitude;
        deliveryLng = this.order.delivery_longitude;
      } else {
        console.log('Usando coordenadas de entrega por defecto:', [deliveryLat, deliveryLng]);
      }
      
      // Establecer la ubicación de entrega
      this.deliveryLocation = L.latLng(deliveryLat, deliveryLng);
      // Establecer descripción para la UI
      this.currentDeliveryLocation = locationDescription;
    } else {
      // Si no hay datos del pedido, usar valores por defecto
      this.orderStatus = 'pending';
      this.deliveryProgress = 0;
      this.currentDeliveryLocation = 'Tienda';
      this.deliveryLocation = L.latLng(39.48263244501666, -0.3468536984598463);
    }
      
      // Cargar la tienda asociada si existe store_id
      if (this.order?.store_id) {
        await this.loadStoreLocation();
      }
      
      // Actualizar información de seguimiento
      this.updateTrackingInfo();
      
      // Si el mapa ya está inicializado, actualizarlo
      if (this.leafletMap) {
        this.updateMapRoute();
      }
    } catch (error: any) {
      console.error('Error cargando detalles del pedido:', error);
      this.error = error.message || 'Error cargando detalles del pedido';
    } finally {
      this.loading = false;
    }
    
    // Iniciar actualización automática si está habilitada y el pedido existe y no está entregado
    if (this.isAutoUpdateEnabled && this.order && this.order.status !== 'delivered') {
      // Pequeña demora para permitir que se inicialice la interfaz
      setTimeout(() => this.startAutoUpdate(), 1000);
    }
  }
  
  async loadStoreLocation() {
    if (!this.order?.store_id) {
      console.warn('No hay store_id en el pedido');
      // Ubicación por defecto para la tienda (Valencia)
      this.storeLocation = L.latLng(39.471, -0.376);
      return;
    }
    
    try {
      console.log('Obteniendo datos de la tienda con ID:', this.order.store_id);
      
      const { data, error } = await this.supabaseService.getClient()
        .from('stores')
        .select('*')
        .eq('id', this.order.store_id)
        .single();
      
      if (error) {
        console.error('Error obteniendo datos de la tienda:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('No se encontraron datos de la tienda, usando ubicación por defecto');
        this.storeLocation = L.latLng(39.471, -0.376); // Valencia
        return;
      }
      
      console.log('Datos de la tienda obtenidos:', data);
      
      // Verificar si la tienda tiene coordenadas
      if (data.latitude && data.longitude) {
        console.log('Usando coordenadas de la tienda:', [data.latitude, data.longitude]);
        this.storeLocation = L.latLng(data.latitude, data.longitude);
      } else {
        console.warn('La tienda no tiene coordenadas, usando ubicación por defecto');
        this.storeLocation = L.latLng(39.471, -0.376); // Valencia
      }
      
      // Actualizar la información de la tienda en el componente si es necesario
      // Por ejemplo, mostrar el nombre de la tienda
    } catch (e) {
      console.error('Error cargando ubicación de la tienda:', e);
      this.storeLocation = L.latLng(39.471, -0.376); // Valencia como respaldo
    }
  }
  
  initMap() {
    try {
      if (!this.mapElement?.nativeElement) {
        console.error('Elemento del mapa no encontrado');
        alert('Error: No se pudo encontrar el elemento del mapa');
        return;
      }
      
      console.log('Iniciando configuración del mapa');
      const mapContainer = this.mapElement.nativeElement as HTMLElement;
      
      // SUPER IMPORTANTE: Asegurarnos que el contenedor tenga altura visible
      mapContainer.style.height = '300px';
      mapContainer.style.width = '100%';
      mapContainer.style.display = 'block';
      mapContainer.style.position = 'relative';
      mapContainer.style.zIndex = '1'; // Asegurar que está en primer plano
      mapContainer.style.border = '1px solid #ccc'; // Borde visible para depuración
      
      console.log('Contenedor del mapa configurado con dimensiones visibles');
      
      // Crear un div de prueba para verificar si el problema es el mapa o el contenedor
      const testDiv = document.createElement('div');
      testDiv.style.width = '100%';
      testDiv.style.height = '50px';
      testDiv.style.backgroundColor = 'red';
      testDiv.textContent = 'TEST DIV - Si puedes ver esto, el contenedor funciona';
      mapContainer.appendChild(testDiv);
      
      // Esperar menos tiempo para mejorar la respuesta
      setTimeout(() => {
        try {
          // Eliminar el div de prueba
          mapContainer.removeChild(testDiv);
          
          console.log('Creando mapa básico con Leaflet');
          
          // Inicializar el mapa con opciones básicas
          this.leafletMap = L.map(mapContainer, {
            center: [39.471, -0.376], // Centro de Valencia
            zoom: 14, // Nivel de zoom adecuado para ciudad
            zoomControl: true, // Mostrar controles de zoom
            attributionControl: true // Mostrar atribuciones
          });
          
          // Añadir capa base del mapa con estilo cartoDB (más moderno y atractivo)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(this.leafletMap);
          
          console.log('Mapa base añadido correctamente');
          
          // Forzar redimensionado inmediatamente y después de un breve retraso
          this.leafletMap.invalidateSize(true);
          
          // Añadir marcadores básicos y línea para la entrega
          this.addSimpleDeliveryRoute();
          
          // Marcar que el mapa se ha inicializado correctamente
          this.mapInitialized = true;
          
          // Reinvalidar tamaño después de un momento para asegurar visualización correcta
          setTimeout(() => this.leafletMap?.invalidateSize(true), 100);
          
          // Aplicar estilos directamente a los elementos de Leaflet
          this.applyLeafletStyles();
        } catch (error) {
          console.error('Error al inicializar el mapa:', error);
          alert('Error al crear el mapa: ' + error);
          
          // Mostrar un mensaje de error en el contenedor
          mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Error al cargar el mapa</div>';
        }
      }, 500); // Reducido de 2000ms a 500ms
    } catch (error) {
      console.error('Error general al configurar el mapa:', error);
    }
  }
  
  // Aplicar estilos directamente a los elementos DOM de Leaflet
  applyLeafletStyles() {
    try {
      // Forzar aplicación de estilos a los elementos de Leaflet
      setTimeout(() => {
        // Estilizar línea de ruta a naranja con efecto de sombra
        const routeLines = document.querySelectorAll('.route-line');
        routeLines.forEach(line => {
          (line as HTMLElement).style.stroke = '#FF7B00';
          (line as HTMLElement).style.strokeWidth = '6';
          (line as HTMLElement).style.strokeDasharray = '10, 10';
          (line as HTMLElement).style.strokeLinecap = 'round';
          (line as HTMLElement).style.filter = 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))';
        });
        
        // Asegurar que los zoom controls tengan estilo correcto
        const zoomControls = document.querySelectorAll('.leaflet-control-zoom a');
        zoomControls.forEach(control => {
          (control as HTMLElement).style.width = '36px';
          (control as HTMLElement).style.height = '36px';
          (control as HTMLElement).style.lineHeight = '36px';
          (control as HTMLElement).style.fontSize = '18px';
          (control as HTMLElement).style.backgroundColor = 'white';
          (control as HTMLElement).style.color = '#333';
        });
        
        // Aplicar estilos a los popups
        const popups = document.querySelectorAll('.leaflet-popup-content-wrapper');
        popups.forEach(popup => {
          (popup as HTMLElement).style.padding = '0';
          (popup as HTMLElement).style.borderRadius = '12px';
          (popup as HTMLElement).style.overflow = 'hidden';
          (popup as HTMLElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
        });
        
        // Ocultar los contenedores de instrucciones de ruta
        const routingContainers = document.querySelectorAll('.leaflet-routing-container');
        routingContainers.forEach(container => {
          (container as HTMLElement).style.display = 'none';
        });
      }, 200);
    } catch (error) {
      console.error('Error al aplicar estilos a Leaflet:', error);
    }
  }
  
  // Método simplificado para agregar una ruta directa entre tienda y destino
  addSimpleDeliveryRoute() {
    try {
      if (!this.leafletMap) {
        console.error('No hay mapa disponible para agregar ruta');
        return;
      }

      // Coordenadas fijas
      const storeLocation = L.latLng(39.471, -0.376); // Valencia (tienda)
      const deliveryLocation = L.latLng(39.482686033242544, -0.346761123456372); // Punto de entrega
      
      // Actualizar las propiedades de la clase
      this.storeLocation = storeLocation;
      this.deliveryLocation = deliveryLocation;
      
      console.log('Agregando marcadores y ruta básica al mapa');
      
      // Marcador de la tienda (verde) - versión mejorada y más grande
      const storeIcon = L.divIcon({
        className: 'custom-marker store-marker',
        html: `<div class="marker-content">
                <ion-icon name="storefront-outline"></ion-icon>
              </div>`,
        iconSize: [50, 50] as [number, number],  // Más grande
        iconAnchor: [25, 45] as [number, number],
        popupAnchor: [0, -40] as [number, number]
      });
      
      // Crear un popup personalizado
      const storePopup = L.popup({
        className: 'custom-popup',
        closeButton: true,
        autoClose: true,
        closeOnEscapeKey: true,
        closeOnClick: true
      }).setContent('<div class="popup-content"><strong>Tienda</strong></div>');
      
      L.marker(storeLocation, {icon: storeIcon})
        .addTo(this.leafletMap)
        .bindPopup(storePopup)
        .openPopup();
      
      // Marcador del punto de entrega (rojo) - versión mejorada y más grande
      const deliveryIcon = L.divIcon({
        className: 'custom-marker delivery-marker',
        html: `<div class="marker-content">
                <ion-icon name="location"></ion-icon>
              </div>`,
        iconSize: [50, 50] as [number, number],  // Más grande
        iconAnchor: [25, 45] as [number, number],
        popupAnchor: [0, -40] as [number, number]
      });
      
      // Crear un popup personalizado
      const deliveryPopup = L.popup({
        className: 'custom-popup',
        closeButton: true,
        autoClose: true,
        closeOnEscapeKey: true,
        closeOnClick: true
      }).setContent('<div class="popup-content"><strong>Punto de entrega</strong></div>');
      
      L.marker(deliveryLocation, {icon: deliveryIcon})
        .addTo(this.leafletMap)
        .bindPopup(deliveryPopup);
      
      // Línea de ruta (estilo más visible y atractivo)
      const routeLine = L.polyline([
        [storeLocation.lat, storeLocation.lng],
        [deliveryLocation.lat, deliveryLocation.lng]
      ], {
        color: '#FF7B00', // Naranja como el botón de COL 
        weight: 8,       // Más gruesa
        opacity: 1,      // Totalmente opaca
        dashArray: '15, 10',
        lineJoin: 'round',
        lineCap: 'round',
        className: 'route-line'
      }).addTo(this.leafletMap);
      
      // Ajustar la vista para mostrar ambos puntos
      this.leafletMap.fitBounds(routeLine.getBounds(), {
        padding: [30, 30],
        maxZoom: 15
      });
      
      // Calcular distancia aproximada y tiempo
      const distanceInMeters = storeLocation.distanceTo(deliveryLocation);
      this.estimatedDistance = this.formatDistance(distanceInMeters);
      
      // Tiempo estimado (asumiendo 20 km/h de velocidad media en ciudad)
      const timeInSeconds = (distanceInMeters / 1000) / 20 * 3600; // horas a segundos
      this.estimatedTime = this.formatTime(timeInSeconds);
      
      console.log(`Ruta creada: ${this.estimatedDistance}, tiempo estimado: ${this.estimatedTime}`);
    } catch (error) {
      console.error('Error al crear la ruta simple:', error);
    }
  }
  
  // Este método ya no se usa, mantenemos addSimpleDeliveryRoute en su lugar
  updateMapRoute() {
    // Llamamos al método simplificado
    this.addSimpleDeliveryRoute();
  }
  
  updateTrackingInfo() {
    if (!this.order) return;
    
    // Actualizar el progreso de entrega
    this.deliveryProgress = this.order.delivery_progress || 0;
    
    // Actualizar los pasos completados según el estado del pedido
    switch (this.order.status) {
      case 'pending':
        this.deliverySteps[0].completed = true;
        this.deliverySteps[1].completed = false;
        this.deliverySteps[2].completed = false;
        this.deliverySteps[3].completed = false;
        break;
      case 'processing':
        this.deliverySteps[0].completed = true;
        this.deliverySteps[1].completed = true;
        this.deliverySteps[2].completed = false;
        this.deliverySteps[3].completed = false;
        break;
      case 'shipping':
        this.deliverySteps[0].completed = true;
        this.deliverySteps[1].completed = true;
        this.deliverySteps[2].completed = true;
        this.deliverySteps[3].completed = false;
        break;
      case 'delivered':
        this.deliverySteps[0].completed = true;
        this.deliverySteps[1].completed = true;
        this.deliverySteps[2].completed = true;
        this.deliverySteps[3].completed = true;
        break;
      default:
        // Usar el progreso numérico como respaldo
        if (this.deliveryProgress >= 25) {
          this.deliverySteps[0].completed = true;
        }
        if (this.deliveryProgress >= 50) {
          this.deliverySteps[1].completed = true;
        }
        if (this.deliveryProgress >= 75) {
          this.deliverySteps[2].completed = true;
        }
        if (this.deliveryProgress >= 100) {
          this.deliverySteps[3].completed = true;
        }
        break;
    }
    
    // Tiempo estimado de entrega
    if (this.order.estimated_delivery_time) {
      this.estimatedTime = this.order.estimated_delivery_time;
    } else {
      // Calcular una estimación
      const now = new Date();
      const estimatedDelivery = new Date(now.getTime() + (45 * 60000)); // 45 minutos por defecto
      const hours = estimatedDelivery.getHours().toString().padStart(2, '0');
      const minutes = estimatedDelivery.getMinutes().toString().padStart(2, '0');
      this.estimatedTime = `${hours}:${minutes}`;
    }
  }
  
  // Método para simular el cambio de estado (para demostración)
  async simulateNextStep() {
    if (!this.order) {
      alert('No hay un pedido cargado para simular');
      return;
    }
    
    // Determinar el próximo estado basado en el estado actual
    let nextStatus = '';
    let nextProgress = 0;
    let nextLocationText = '';
    let locationData: any = null;
    let estimatedTime = '';
    
    // Calcular el tiempo estimado de entrega (siempre actualizado)
    const now = new Date();
    const timeEstimate = new Date(now.getTime() + (30 * 60000)); // 30 minutos desde ahora
    const hours = timeEstimate.getHours().toString().padStart(2, '0');
    const minutes = timeEstimate.getMinutes().toString().padStart(2, '0');
    estimatedTime = `${hours}:${minutes}`;
    
    // Coordenadas para usar en current_location
    const defaultLat = 39.48263244501666;
    const defaultLng = -0.34679198179086346;
    
    // Transición de estados basada en el estado actual
    switch(this.orderStatus) {
      case 'pending':
        nextStatus = 'processing';
        nextProgress = 25;
        nextLocationText = 'En preparación en la tienda';
        // Crear objeto de ubicación con coordenadas
        locationData = {
          description: nextLocationText,
          coordinates: [defaultLat, defaultLng]
        };
        // Configurar tiempo de entrega estimado más corto para la simulación rápida
        estimatedTime = '1 min';
        break;
      case 'processing':
        nextStatus = 'shipping';
        nextProgress = 50;
        nextLocationText = 'En ruta para entrega';
        
        // Simular posición del repartidor
        this.simulateDeliveryLocation();
        
        // Si tenemos la ubicación del repartidor, usarla
        if (this.currentLocation) {
          locationData = {
            description: nextLocationText,
            coordinates: [this.currentLocation.lat, this.currentLocation.lng]
          };
        } else {
          // Si no, usar posición predeterminada
          locationData = {
            description: nextLocationText,
            coordinates: [defaultLat, defaultLng]
          };
        }
        // Actualizar tiempo estimado restante para la simulación rápida
        estimatedTime = '30 seg';
        break;
      case 'shipping':
        nextStatus = 'delivered';
        nextProgress = 100;
        nextLocationText = 'Entregado en destino';
        
        // Ubicación final es el punto de entrega
        locationData = {
          description: nextLocationText,
          coordinates: [this.deliveryLocation ? this.deliveryLocation.lat : defaultLat, 
                         this.deliveryLocation ? this.deliveryLocation.lng : defaultLng]
        };
        // Tiempo de entrega ya cumplido
        estimatedTime = '0 min';
        break;
      case 'delivered':
        // Ya está entregado, no hay cambio
        console.log('El pedido ya ha sido entregado.');
        return;
      default:
        // Si el estado no es reconocido, comenzar desde pending
        nextStatus = 'processing';
        nextProgress = 50;
        nextLocationText = 'En preparación en la tienda';
        // Crear objeto de ubicación con coordenadas
        locationData = {
          description: nextLocationText,
          coordinates: [defaultLat, defaultLng]
        };
        estimatedTime = '1 min';
    }
    
    try {
      console.log(`Actualizando estado del pedido: ${this.order.status} -> ${nextStatus} (${nextProgress}%)`);
      
      // Actualizar en la base de datos
      const { error } = await this.supabaseService.getClient()
        .from('orders')
        .update({
          status: nextStatus,
          delivery_progress: nextProgress,
          current_location: JSON.stringify(locationData), // Guarda los datos de ubicación como JSON
          estimated_delivery_time: estimatedTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.order.id);
      
      if (error) {
        console.error('Error al actualizar en Supabase:', error);
        throw error;
      }
      
      // Actualizar localmente
      this.order.status = nextStatus as any;
      this.order.delivery_progress = nextProgress;
      this.order.current_location = JSON.stringify(locationData);
      this.order.estimated_delivery_time = estimatedTime;
      
      // Actualizar UI
      this.orderStatus = nextStatus;
      this.deliveryProgress = nextProgress;
      this.currentDeliveryLocation = nextLocationText; // Usar el texto descriptivo para la UI
      this.estimatedTime = estimatedTime;
      
      // Actualizar información visual y mapa
      this.updateTrackingInfo();
      if (nextStatus === 'shipping') {
        this.updateMapRoute(); // Actualizar ruta solo si está en camino
      }
      
      // Si el estado acaba de cambiar a delivered, detener actualizaciones y mostrar modal
      if (nextStatus === 'delivered') {
        this.stopAutoUpdate();
        
        // Esperar un momento para que se actualice la UI y se vea el estado final
        setTimeout(() => this.showDeliverySuccessModal(), 1000);
      }
    } catch (e) {
      console.error('Error actualizando el estado del pedido:', e);
      alert('Ha ocurrido un error al actualizar el estado del pedido.');
    }
  }
  
  // Métodos para actualización automática
  startAutoUpdate() {
    console.log('Iniciando actualización automática rápida');
    // Detener si ya existe
    this.stopAutoUpdate();
    
    // Comenzar actualizaciones cada 15 segundos para completar todo en menos de 1 minuto
    // (4 estados: pending -> processing -> shipping -> delivered)
    this.autoUpdateTimer = setInterval(() => {
      // Solo avanzar si hay un pedido cargado y no ha sido entregado
      if (this.order && this.order.status !== 'delivered') {
        console.log('Actualizando automáticamente el estado del pedido');
        this.simulateNextStep();
      } else if (this.order?.status === 'delivered') {
        // Detener actualizaciones si ya se entregó
        this.stopAutoUpdate();
      }
    }, 15000); // Cada 15 segundos (completa en ~45 segundos)
    
    // Ejecutar la primera actualización inmediatamente si el estado es pending
    if (this.order && this.order.status === 'pending') {
      setTimeout(() => this.simulateNextStep(), 500);
    }
  }
  
  stopAutoUpdate() {
    if (this.autoUpdateTimer) {
      console.log('Deteniendo actualización automática');
      clearInterval(this.autoUpdateTimer);
      this.autoUpdateTimer = null;
    }
  }
  
  // Simular la posición del repartidor para la demostración
  private simulateDeliveryLocation() {
    if (!this.storeLocation || !this.deliveryLocation) return;

    const progress = this.deliveryProgress || 0;
    
    // Calcular posición intermedia basada en el progreso
    if (progress >= 50 && progress < 100) {
      const lat = this.storeLocation.lat + ((this.deliveryLocation.lat - this.storeLocation.lat) * (progress / 100));
      const lng = this.storeLocation.lng + ((this.deliveryLocation.lng - this.storeLocation.lng) * (progress / 100));
      
      // Crear un LatLng de Leaflet en lugar de un objeto simple
      this.currentLocation = L.latLng(lat, lng);
      
      // Actualizar marcador en el mapa si existe
      if (this.leafletMap && this.currentLocation) {
        this.updateMapRoute();
      }
    }
  }
  
  // Método para actualizar el mapa con la ubicación actual del repartidor
  private updateMapWithCurrentLocation() {
    if (!this.leafletMap || !this.currentLocation) return;
    
    // Actualizar el mapa con la nueva ubicación
    this.updateMapRoute();
  }
  
  // Mostrar modal de entrega exitosa
  async showDeliverySuccessModal() {
    try {
      const modal = await this.modalCtrl.create({
        component: DeliverySuccessModalComponent,
        cssClass: 'delivery-success-modal',
        backdropDismiss: false, // No se puede cerrar tocando fuera
        animated: true,
        showBackdrop: true,
      });
      
      await modal.present();
      
      // Cuando se cierre el modal (al pulsar el botón de volver al inicio)
      const { data } = await modal.onWillDismiss();
      
      // La navegación se maneja dentro del modal
    } catch (error) {
      console.error('Error al mostrar el modal de entrega exitosa:', error);
      // En caso de error, navegar al inicio directamente
      this.navCtrl.navigateRoot('/tabs/stores');
    }
  }
  
  // Formatear distancia en metros a un formato legible (km o m)
  formatDistance(distance: number): string {
    if (!distance || distance < 0) return '0 m';
    
    if (distance >= 1000) {
      return (distance / 1000).toFixed(1) + ' km';
    } else {
      return Math.round(distance) + ' m';
    }
  }
  
  // Formatear tiempo en segundos a un formato legible (horas, minutos)
  formatTime(time: number): string {
    if (!time || time < 0) return '0 min';
    
    const minutes = Math.floor(time / 60);
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return hours + ' h ' + (remainingMinutes > 0 ? remainingMinutes + ' min' : '');
    } else {
      return minutes + ' min';
    }
  }
}
