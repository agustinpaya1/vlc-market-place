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
import { Router } from '@angular/router';
import { Location } from '@angular/common';

// Interfaz para el objeto de orden
interface OrderObject {
  user_id: string;
  total_price: number;
  status: string;
  vlcoin_used: number;
  store_id?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  [key: string]: any; // Permitir propiedades adicionales
}

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
  pickupTrackingCode: string = '';
  
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

  // Siempre modo desarrollo para simular pagos
  private isDevelopment = true;

  private trackerInterval: any;
  private trackerTimeouts: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private location: Location
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
      // Asegurar que siempre estamos en modo desarrollo
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
      
      // Forzar siempre isCardComplete a true después de un pequeño delay
      // Esto permitirá usar cualquier número de tarjeta
      setTimeout(() => {
        this.isCardComplete = true;
      }, 500);
      
      // Listen for changes in the card element
      cardElement.on('change', (event) => {
        // Forzar a que siempre esté completa, independientemente de la entrada
        this.isCardComplete = true;
        this.errorMessage = '';
      });
    } catch (error) {
      this.errorMessage = 'Error setting up payment form. Please try again.';
    }
  }

  ngOnDestroy() {
    if (this.trackerInterval) {
      clearInterval(this.trackerInterval);
    }
    // Limpiar timeouts
    this.trackerTimeouts.forEach(t => clearTimeout(t));
    this.trackerTimeouts = [];

  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  async processPayment() {
    // Asegurar modo desarrollo para evitar errores de Stripe
    this.isDevelopment = true;
    
    // Simplificar validaciones
    if (this.vlcoinsToUse < 0) {
      this.errorMessage = 'Cantidad de VLCoins no puede ser negativa.';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      // Simular un pago exitoso independientemente de la tarjeta introducida
      console.log('Simulando pago exitoso con cualquier tarjeta');
      
      // Breve pausa para simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.paymentSuccess = true;
      this.paymentId = 'dev_' + Math.random().toString(36).substring(2, 15);
      // Generar código de seguimiento inventado
      this.pickupTrackingCode = 'VLCPICK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // 1. Obtener el usuario actual
      const user = await this.authService.getCurrentUser();
      if (!user || !user.id) {
        this.errorMessage = 'No se pudo obtener el usuario autenticado.';
        this.isLoading = false;
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
        
        // Coordenadas para posible uso (ahora las almacenamos por separado)
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
        
        // Objeto simplificado para la inserción en la tabla 'orders'
        // Solo incluimos campos que sabemos que existen en la tabla
        const orderObject: OrderObject = {
          user_id: user.id,
          total_price: this.totalAmount,
          status: 'processing',
          vlcoin_used: 0
        };
        
        // Añadir store_id solo si es válido
        if (storeId) {
          orderObject.store_id = storeId;
        }
        
        // Intentar añadir las coordenadas de entrega si hay campos para ellas
        try {
          // Primero intentamos añadir los campos de latitud/longitud
          orderObject.delivery_latitude = deliveryLatitude;
          orderObject.delivery_longitude = deliveryLongitude;
        } catch (e) {
          console.warn('No se pudieron añadir coordenadas de entrega', e);
        }
        
        console.log('Objeto de orden a insertar:', orderObject);
        
        // Insertar el pedido con el objeto simplificado
        const { data: orderData, error: orderError } = await this.supabaseService.getClient()
          .from('orders')
          .insert(orderObject)
          .select()
          .single();
          
        if (orderError) {
          console.error('Error al guardar el pedido:', orderError);
          this.errorMessage = 'Error al procesar el pedido: ' + orderError.message;
          // Mostrar más detalles del error en la consola para depuración
          console.log('Detalles completos del error:', JSON.stringify(orderError));
          
          // Intentar otra vez con un objeto aún más básico si hay error
          if (orderError.message.includes("column")) {
            console.log("Intentando con objeto más básico...");
            const basicOrderObject = {
              user_id: user.id,
              total_price: this.totalAmount,
              status: 'processing'
            };
            
            const { data: basicOrderData, error: basicOrderError } = await this.supabaseService.getClient()
              .from('orders')
              .insert(basicOrderObject)
              .select()
              .single();
              
            if (basicOrderError) {
              console.error('Error en segundo intento:', basicOrderError);
              this.errorMessage = 'No se pudo crear el pedido. Por favor, inténtalo de nuevo.';
            } else if (basicOrderData) {
              console.log('Pedido guardado correctamente en segundo intento:', basicOrderData);
              this.orderId = basicOrderData.id;
              this.orderStatus = basicOrderData.status;
              
              // Iniciar el seguimiento del pedido
              this.initOrderTracker();
            }
          }
        } else if (orderData) {
          console.log('Pedido guardado correctamente:', orderData);
          this.orderId = orderData.id;
          this.orderStatus = orderData.status;
          
          // Establecer tiempo estimado de entrega
          const now = new Date();
          this.estimatedDeliveryTime = new Date(now.getTime() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          // Iniciar el seguimiento del pedido
          this.initOrderTracker();
        }
      } catch (orderErr) {
        console.error('Excepción al crear el pedido:', orderErr);
        this.errorMessage = 'Error al procesar el pedido: ' + String(orderErr);
      }
    } catch (error) {
      console.error('Error en el procesamiento del pago:', error);
      this.errorMessage = String(error);
      this.paymentSuccess = false;
    } finally {
      this.isLoading = false;
    }
  }

  initOrderTracker() {
    // Reiniciar estados
    this.deliveryProgress = 0;
    this.deliverySteps.forEach(step => step.completed = false);
    this.orderStatus = 'pending';
    this.currentLocation = 'Tienda';
    this.showOrderTracker = true;

    // Simulación de los 4 pasos en 1 minuto (15s por paso)
    let step = 0;
    const totalSteps = this.deliverySteps.length;
    const stepDuration = 15000; // 15 segundos por paso

    this.trackerInterval = setInterval(() => {
      if (step < totalSteps) {
        this.deliverySteps[step].completed = true;
        this.deliveryProgress = ((step + 1) / totalSteps) * 100;
        // Actualizar estado y ubicación
        switch (step) {
          case 0:
            this.orderStatus = 'pending';
            this.currentLocation = 'Tienda';
            break;
          case 1:
            this.orderStatus = 'processing';
            this.currentLocation = 'Preparación';
            break;
          case 2:
            this.orderStatus = 'shipped';
            this.currentLocation = 'En camino';
            break;
          case 3:
            this.orderStatus = 'delivered';
            this.currentLocation = 'Entregado';
            break;
        }
        step++;
      } else {
        clearInterval(this.trackerInterval);
      }
    }, stepDuration);

    // Establecer tiempo estimado de entrega a 1 minuto desde ahora
    const now = new Date();
    this.estimatedDeliveryTime = new Date(now.getTime() + 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  closeTracker() {
    // Cerrar el modal y regresar a la tienda
    this.modalCtrl.dismiss({
      orderId: this.orderId,
      success: true
    }, 'success');
  }

  goToOrderTracking() {
    // Cerrar el modal y navegar a la página de seguimiento de pedidos
    this.modalCtrl.dismiss({
      orderId: this.orderId,
      success: true,
      navigate: true
    }, 'success');
  }

  // Nuevo método para abrir la página de recogida
  goToPickupOrder() {
    // Navegar a la página de QR de recogida
    this.router.navigate([
      '/pickup',
      this.pickupTrackingCode
    ], {
      queryParams: {
        orderId: this.orderId,
        orderDetails: `Total: ${this.totalAmount} €`
      }
    });
  }
} 