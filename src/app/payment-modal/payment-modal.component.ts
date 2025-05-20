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
  checkmarkOutline,
  checkmarkSharp,
  locationSharp,
  timerOutline,
  bicycleOutline,
  qrCodeOutline
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { QRCodeService } from '../services/qr-code.service';
import { NotificationService } from '../services/notification.service';
import { QRCodeComponent } from 'angularx-qrcode';

// Interfaz para el objeto de orden
interface OrderObject {
  user_id: string;
  total_price: number;
  status: string;
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
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QRCodeComponent
  ]
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
  
  // QR code related properties
  qrCodeData: string = '';
  qrCodePrivateKey: string = '';
  showQRCode: boolean = false;
  
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
    private location: Location,
    private qrCodeService: QRCodeService,
    private notificationService: NotificationService
  ) {
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
      'bicycle-outline': bicycleOutline,
      'qr-code-outline': qrCodeOutline
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
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('Iniciando proceso de pago...');
      
      const user = await this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Usuario autenticado:', user.id);

      // Validar items del carrito
      if (!this.cartItems || this.cartItems.length === 0) {
        throw new Error('El carrito está vacío');
      }

      console.log('Items del carrito:', this.cartItems);

      // 1. Crear el pedido primero
      const orderData = {
        user_id: user.id,
        total_price: this.totalAmount,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Creando pedido con datos:', orderData);

      const { data: order, error: orderError } = await this.supabaseService.getClient()
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Error al crear el pedido:', orderError);
        throw new Error(`Error al crear el pedido: ${orderError.message}`);
      }

      if (!order) {
        throw new Error('No se pudo crear el pedido');
      }

      console.log('Pedido creado exitosamente:', order);

      // 2. Crear los items del pedido
      const orderItems = this.cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.offerPrice || item.price,
        created_at: new Date().toISOString()
      }));

      console.log('Creando items del pedido:', orderItems);

      const { error: itemsError } = await this.supabaseService.getClient()
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error al crear los items del pedido:', itemsError);
        // Eliminar el pedido si falla la creación de items
        await this.supabaseService.getClient()
          .from('orders')
          .delete()
          .eq('id', order.id);
        throw new Error('Error al crear los items del pedido');
      }

      // 3. Generar código QR para el pedido
      console.log('Generando código QR para el pedido:', order.id);
      const qrCode = await this.qrCodeService.createQRCodeForOrder(order.id);
      
      if (!qrCode) {
        console.error('Error al generar el código QR');
        throw new Error('Error al generar el código QR');
      }

      console.log('Código QR generado exitosamente:', qrCode);

      // Guardar el ID del pedido y generar el QR
      this.orderId = order.id;
      this.qrCodeData = JSON.stringify({
        orderId: order.id,
        code: qrCode.code,
        publicKey: qrCode.public_key
      });
      
      // Asignar la clave privada si existe
      this.qrCodePrivateKey = qrCode.privateKey || '';
      this.showQRCode = true;
      this.paymentSuccess = true;

      // Mostrar notificación de éxito
      await this.notificationService.showSuccess('Pedido creado correctamente');

    } catch (error) {
      console.error('Error detallado en el proceso de pago:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago. Por favor, inténtalo de nuevo.';
      this.paymentSuccess = false;
      this.showQRCode = false;
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