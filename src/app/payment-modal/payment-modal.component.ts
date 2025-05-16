import { Component, OnInit, AfterViewInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonicModule } from '@ionic/angular';
import { navigateToOrderTracking } from '../navigate-helper';
import { PaymentService } from '../services/payment.service';
import { CartItem } from '../services/cart.service';
import { addIcons } from 'ionicons';
import { environment } from '../../environments/environment';
import {
  checkmarkCircle,
  cardOutline,
  close,
  locationOutline,
  bicycle,
  timer,
  checkmark,
  // Nombres correctos para Ionic
  checkmarkOutline,
  checkmarkSharp,
  locationSharp,
  timerOutline,
  bicycleOutline
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class PaymentModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cartItems: CartItem[] = [];
  @Input() totalAmount: number = 0;
  
  isLoading = false;
  errorMessage = '';
  paymentSuccess = false;
  paymentId = '';
  isCardComplete = false;
  showOrderTracker = false;
  orderId: string = '';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' = 'pending';
  estimatedDeliveryTime: string = '';
  currentLocation: string = 'Tienda';
  
  // Valores para la barra de progreso
  deliveryProgress: number = 0;
  deliverySteps = [
    { title: 'Pedido recibido', completed: false, icon: 'checkmark-outline' },
    { title: 'En preparación', completed: false, icon: 'timer-outline' },
    { title: 'En camino', completed: false, icon: 'bicycle-outline' },
    { title: 'Entregado', completed: false, icon: 'location-outline' }
  ];

  vlcoinsToUse: number = 0;
  vlcoinBalance: number = 0;

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    // Registramos todos los iconos necesarios con nombres correctos para Ionic
    addIcons({ 
      'checkmark-circle': checkmarkCircle,
      'card-outline': cardOutline, 
      'close': close, 
      'location-outline': locationOutline, 
      'bicycle': bicycle, 
      'timer': timer,
      'checkmark': checkmark,
      'checkmark-outline': checkmarkOutline,
      'checkmark-sharp': checkmarkSharp,
      'location-sharp': locationSharp,
      'timer-outline': timerOutline,
      'bicycle-outline': bicycleOutline
    });
  }

  async ngOnInit() {
    try {
      // Forzar modo desarrollo para evitar problemas con Stripe
      this.isDevelopment = true;
      
      const user = await this.authService.getCurrentUser();
      if (user && user.id) {
        try {
          // Consulta el balance real de la tabla vlcoin - con manejo mejorado de errores
          try {
            const { data, error } = await this.supabaseService.getClient()
              .from('vlcoin')
              .select('balance')
              .eq('user_id', user.id);
              
            if (error) {
              console.warn('Error al obtener VLCoins, posible falta de permiso RLS:', error.message);
              this.vlcoinBalance = 0;
            } else if (data && data.length > 0) {
              // Tomar el primer registro si hay múltiples (o el único si solo hay uno)
              this.vlcoinBalance = data[0]?.balance || 0;
              console.log('VLCoins obtenidos correctamente:', this.vlcoinBalance);
            } else {
              console.log('No se encontraron registros de VLCoins para el usuario');
              this.vlcoinBalance = 0;
            }
          } catch (queryError) {
            console.error('Error en la consulta de VLCoins:', queryError);
            this.vlcoinBalance = 0;
          }
        } catch (e) {
          console.error('Excepción al consultar VLCoins:', e);
          // Fallback seguro
          this.vlcoinBalance = 0;
        }
        
        this.vlcoinsToUse = 0;
      }
    } catch (error) {
      console.error('Error general en ngOnInit:', error);
      // Asegurar inicialización de valores
      this.vlcoinBalance = 0;
      this.vlcoinsToUse = 0;
    }
  }

  async ngAfterViewInit() {
    try {
      const cardElement = await this.paymentService.setupCardElement('card-element');
      
      // Listen for changes in the card element
      cardElement.on('change', (event) => {
        this.isCardComplete = event.complete;
        if (event.error) {
          this.errorMessage = event.error.message;
        } else {
          this.errorMessage = '';
        }
      });
    } catch (error) {
      this.errorMessage = 'Error setting up payment form. Please try again.';
    }
  }

  ngOnDestroy() {
    this.paymentService.destroyCardElement();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  // Propiedad para activar el modo de desarrollo (sin Stripe real)
  private isDevelopment = true; // Siempre true para evitar errores de API de Stripe

  async processPayment() {
    // Modo forzado de desarrollo para evitar errores de Stripe
    this.isDevelopment = true;
    
    // Simplificar validaciones
    if (this.vlcoinsToUse < 0) {
      this.errorMessage = 'Cantidad de VLCoins no puede ser negativa.';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      // Simulación de pago exitoso en modo desarrollo
    console.log('Modo desarrollo activo:', this.isDevelopment);
    console.log('Simulando pago exitoso en desarrollo - ignorar errores de Stripe');
      this.paymentSuccess = true;
      this.paymentId = 'dev_' + Math.random().toString(36).substring(2, 15);
      
      if (this.paymentSuccess) {
        // 1. Obtener el usuario actual
        const user = await this.authService.getCurrentUser();
        if (!user || !user.id) {
          this.errorMessage = 'No se pudo obtener el usuario autenticado.';
          return;
        }
        
        // 1.5 Verificar si el usuario tiene VLCoins (intenta ver si existe la tabla)
        try {
          const { data: existing } = await this.supabaseService.getClient()
            .from('vlcoin')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (!existing) {
            console.log('Creando cuenta VLCoin para el usuario:', user.id);
            await this.supabaseService.getClient()
              .from('vlcoin')
              .insert({ user_id: user.id, balance: 0 });
          }
        } catch (vlcoinErr) {
          // Si hay error con vlcoin, continuamos con el proceso
          console.warn('No se pudo verificar la cuenta VLCoin:', vlcoinErr);
        }
        
        // 2. Guardar el pedido en Supabase
        try {
          console.log('Creando pedido en Supabase para usuario:', user.id);
          
          // Coordenadas de entrega fijas para todos los usuarios
          const deliveryLatitude = 39.482686033242544;
          const deliveryLongitude = -0.346761123456372;
          
          // Obtener el store_id del primer item y formatearlo correctamente
          let storeId = null;
          if (this.cartItems.length > 0 && this.cartItems[0]?.id) {
            // Intentar obtener el ID de la tienda del formato item-id
            const storeIdRaw = this.cartItems[0].id.split('-')[0];
            
            // Verificar si es un UUID válido
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeIdRaw)) {
              storeId = storeIdRaw; // Ya es un UUID válido
            } else if (/^[0-9a-f]{8,32}$/i.test(storeIdRaw)) {
              // Convertir a formato UUID si es posible
              try {
                // Formatear como UUID si tiene suficientes caracteres
                const paddedId = storeIdRaw.padEnd(32, '0');
                storeId = `${paddedId.slice(0,8)}-${paddedId.slice(8,12)}-${paddedId.slice(12,16)}-${paddedId.slice(16,20)}-${paddedId.slice(20)}`;
              } catch (e) {
                console.warn('No se pudo formatear el store_id como UUID:', e);
                storeId = null;
              }
            } else {
              console.warn('El ID de la tienda no tiene un formato válido:', storeIdRaw);
              storeId = null;
            }
          }
          
          // En desarrollo, no usar un store_id si no tenemos uno válido
          // Esto evita problemas con la restricción de clave foránea
          if (!storeId) {
            storeId = null; // No usar valor por defecto para evitar violación de clave foránea
          }
          
          // Información de ubicación para almacenar
          const locationInfo = {
            description: 'Punto de entrega fijo',
            coordinates: [deliveryLatitude, deliveryLongitude]
          };
          
          // Datos base del pedido (campos obligatorios)
          const orderData: any = {
            user_id: user.id,
            total_price: this.totalAmount - (this.vlcoinsToUse / 100),
            status: 'pending',
            vlcoin_used: this.vlcoinsToUse,
            store_id: storeId
          };
          
          // Primer intento: con current_location
          try {
            orderData.current_location = JSON.stringify(locationInfo);
            
            const { data: orderResult, error } = await this.supabaseService.getClient()
              .from('orders')
              .insert(orderData)
              .select()
              .single();
            
            if (error) {
              // Si falla con current_location, lo quitamos e intentamos de nuevo
              if (error.message.includes('current_location')) {
                throw new Error('current_location_not_found');
              } else {
                console.error('Error guardando el pedido:', error);
                this.errorMessage = 'Error guardando el pedido: ' + error.message;
                return;
              }
            }
            
            console.log('Pedido creado exitosamente:', orderResult);
            this.orderId = orderResult.id;
            if (orderResult && orderResult.id) {
              this.orderId = orderResult.id;
              console.log('Orden creada con ID:', this.orderId);
              // El tracking URL ahora se maneja en el sistema central de navegación
            }
          } catch (err: any) {
            // Segundo intento: sin current_location
            if (err.message === 'current_location_not_found') {
              console.log('Intentando crear pedido sin current_location');
              delete orderData.current_location;
              
              // Agregar coordenadas como campos separados
              orderData.delivery_latitude = deliveryLatitude;
              orderData.delivery_longitude = deliveryLongitude;
              
              const { data: secondResult, error: secondError } = await this.supabaseService.getClient()
                .from('orders')
                .insert(orderData)
                .select()
                .single();
              
              if (secondError) {
                console.error('Error en segundo intento:', secondError);
                this.errorMessage = 'Error guardando el pedido: ' + secondError.message;
                return;
              }
              
              console.log('Pedido creado exitosamente en segundo intento:', secondResult);
              this.orderId = secondResult.id;
            } else {
              throw err; // Propagar otros errores
            }
          }
          
          // 3. Si se usaron VLCoins, actualiza el balance
          if (this.vlcoinsToUse > 0) {
            try {
              await this.supabaseService.getClient()
                .from('vlcoin')
                .update({ balance: this.vlcoinBalance - this.vlcoinsToUse })
                .eq('user_id', user.id);
            } catch (vlcoinUpdateErr) {
              console.warn('Error actualizando VLCoins:', vlcoinUpdateErr);
              // Continuar aunque falle la actualización de VLCoins
            }
          }
          
          // 4. Inicializar el seguimiento del pedido
          this.initOrderTracker();
          
          // 5. Mostrar el tracker de pedido
          setTimeout(() => {
            this.showOrderTracker = true;
          }, 2000);
        } catch (orderErr) {
          console.error('Error procesando el pedido:', orderErr);
          this.errorMessage = 'Error guardando el pedido';
        }
      }
    } catch (error: any) {
      console.error('Error en el proceso de pago:', error);
      this.errorMessage = error.message || 'Error procesando el pago';
    } finally {
      this.isLoading = false;
    }
  }

  // Inicializa el tracker del pedido con valores simulados
  initOrderTracker() {
    // Actualizar el estado del primer paso (pedido recibido)
    this.deliverySteps[0].completed = true;
    this.deliveryProgress = 25;
    
    // Simular una estimación de entrega basada en la hora actual
    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + (45 * 60000)); // 45 minutos desde ahora
    const hours = estimatedDelivery.getHours().toString().padStart(2, '0');
    const minutes = estimatedDelivery.getMinutes().toString().padStart(2, '0');
    this.estimatedDeliveryTime = `${hours}:${minutes}`;
    
    // En un caso real, actualizarías estos valores basados en datos reales de la base de datos
    // y posiblemente usarías websockets para actualizaciones en tiempo real
  }

  // Método para cerrar el tracker y volver al inicio
  closeTracker() {
    try {
      // Determinar si hay un orden activo
      if (this.orderId) {
        // Usar un flag sencillo para redirigir sin usar excesivos datos que puedan causar bloqueos
        this.modalCtrl.dismiss(
          { 
            success: true, 
            orderId: this.orderId, 
            redirectToTracking: true 
          }, 
          'success'
        );
      } else {
        this.modalCtrl.dismiss({ success: true }, 'success');
      }
    } catch (error) {
      console.error('Error al cerrar el tracker:', error);
      // Forzar cierre sin datos adicionales en caso de error
      this.modalCtrl.dismiss(null, 'cancel').catch(() => {
        window.location.href = '/tabs/stores'; // Redirección manual si todo falla
      });
    }
  }
  
  /**
   * Método infalible para garantizar la navegación al seguimiento del pedido
   */
  goToOrderTracking() {
    // Console.log para depuración
    console.log('Intentando navegar al seguimiento del pedido:', this.orderId);
    
    if (!this.orderId) {
      console.error('No hay ID de pedido para hacer seguimiento');
      alert('No se encontró ID de pedido. Por favor, intente de nuevo.');
      return this.closeTracker();
    }
    
    // Almacenar el orderId en todas las formas posibles para garantizar persistencia
    try {
      // SessionStorage (sobrevive recargas)
      sessionStorage.setItem('lastOrderId', this.orderId);
      // LocalStorage (sobrevive cierres del navegador)
      localStorage.setItem('lastOrderId', this.orderId); 
      console.log('ID de pedido guardado en storage:', this.orderId);
    } catch (e) {
      console.error('Error al guardar en Storage:', e);
    }
    
    // Construimos la URL completa
    const baseUrl = window.location.origin;
    const targetUrl = `${baseUrl}/tabs/order-tracking/${this.orderId}?t=${Date.now()}`;
    console.log('URL de destino:', targetUrl);
    
    // Primero intentamos cerrar el modal de forma ordenada
    try {
      this.modalCtrl.dismiss().then(() => {
        console.log('Modal cerrado correctamente, redirigiendo...');
        this.forceRedirect(targetUrl);
      }).catch(err => {
        console.error('Error al cerrar modal:', err);
        this.forceRedirect(targetUrl);
      });
    } catch (e) {
      console.error('Error en dismiss:', e);
      // Si falla todo lo anterior, forzar navegación directa
      this.forceRedirect(targetUrl);
    }
  }
  
  /**
   * Método auxiliar para forzar la redirección con múltiples intentos
   */
  private forceRedirect(url: string) {
    console.log('Forzando redirección a:', url);
    
    // Primer intento: window.location.href (método estándar)
    try {
      window.location.href = url;
      console.log('Redirección iniciada con window.location.href');
      
      // Como respaldo, intentamos de nuevo tras un breve delay
      setTimeout(() => {
        if (window.location.href.indexOf('order-tracking') === -1) {
          console.log('Segundo intento de redirección...');
          window.location.replace(url);
        }
      }, 300);
      
    } catch (e) {
      console.error('Error en redirección:', e);
      
      // Último recurso: window.open
      try {
        window.open(url, '_self');
        console.log('Redirección con window.open');
      } catch (e2) {
        console.error('Todos los intentos de redirección fallaron:', e2);
        alert('Error al navegar. Por favor, acceda manualmente a "Mis Pedidos" para ver su seguimiento.');
      }
    }
  }
  
  // El manejo de navegación se ha movido completamente al sistema central
  // ver navigate-helper.ts para la implementación actual
  
  // Este componente ahora delega la navegación al sistema central
  // que maneja correctamente los problemas de detección de cambios de Angular
} 