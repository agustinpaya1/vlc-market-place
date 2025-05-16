import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {   IonHeader,   IonToolbar,   IonTitle,   IonContent,   IonButtons,   IonButton,   IonIcon,   IonCard,   IonCardContent,  IonLabel,  IonSegment,  IonSegmentButton,  IonProgressBar,  IonRow,  IonCol,  IonGrid,  ModalController,  ToastController} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  close, 
  helpCircleOutline, 
  timeOutline, 
  starOutline, 
  walletOutline, 
  bagOutline,
  storefront,
  personOutline,
  ribbonOutline,
  trophyOutline,
  medalOutline,
  checkmarkCircleOutline,
  checkmarkDoneCircleOutline,
  checkmarkCircle,
  shieldCheckmark,
  giftOutline,
  arrowForwardOutline,
  shareOutline,
  cart,
  cartOutline,
  basket,
  basketOutline,
  storefrontOutline,
  star,
  person,
  personCircle,
  globe,
  globeOutline,
  share,
  chatbubbleOutline,
  thumbsUp,
  mapOutline,
  locationOutline,
  pin,
  pinOutline,
  compass,
  compassOutline,
  sunny,
  moon
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { VlcoinService } from '../services/vlcoin.service';

// Interface for Reward type
interface Reward {
  id: number;
  title: string;
  location: string;
  image: string;
  coins: number;
  category: string;
  displayTitle: boolean;
  redeemed?: boolean;
}

@Component({
  selector: 'app-vlcoin-modal',
  templateUrl: './vlcoin-modal.component.html',
  styleUrls: ['./vlcoin-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonCard, 
    IonCardContent,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonProgressBar,
    IonRow,
    IonCol,
    IonGrid
  ]
})
export class VlcoinModalComponent implements OnInit {
  @Input() selectedSegment = 'achievements';
  
  // Propiedades para el estado del modal
  vlcoinBalance = 2450;
  monthlyEarned = 350;
  spent = 120;
  expiring = 200;

  // Datos de logros
  achievements = [
    {
      id: 1,
      title: 'Primera Compra',
      date: '12 mayo 2025',
      icon: 'cart',
      coins: 100,
      completed: true
    },
    {
      id: 2,
      title: 'Visitar 5 Tiendas',
      date: '2 mayo 2025',
      icon: 'storefront',
      coins: 150,
      completed: true
    },
    {
      id: 3,
      title: 'Reseñas Verificadas',
      progress: { current: 0, total: 5 },
      icon: 'star',
      coins: 200,
      completed: false
    },
    {
      id: 4,
      title: 'Perfil Completo',
      date: '28 abril 2025',
      icon: 'person-circle',
      description: '',
      coins: 50,
      completed: true,
      extraIcons: ['checkmark-circle', 'shield-checkmark']
    },
    {
      id: 5,
      title: 'Compartir en Redes',
      date: '25 abril 2025',
      icon: 'share',
      coins: 75,
      completed: true
    }
  ];
  
  // Datos de retos activos
  challenges = [
    {
      id: 1,
      title: 'Reto del Mercado Central',
      description: 'Visita 3 puestos diferentes en el Mercado Central y realiza una compra mínima de 5€ en cada uno.',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/retos//retomercadocentral.png',
      icon: 'basket-outline',
      progress: { current: 0, total: 3 },
      daysLeft: 5,
      coins: 300
    },
    {
      id: 2,
      title: 'Reseñador Experto',
      description: 'Escribe 5 reseñas detalladas con fotos en comercios locales que hayas visitado este mes.',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/retos//Screenshot%202025-05-10%20at%2022.52.33.png',
      icon: 'chatbubble-outline',
      progress: { current: 0, total: 5 },
      daysLeft: 12,
      coins: 250
    },
    {
      id: 3,
      title: 'Explorador de Barrios',
      description: 'Visita y compra en 4 tiendas diferentes en el barrio de Ruzafa durante este mes.',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/retos//explorador.png',
      icon: 'compass-outline',
      progress: { current: 0, total: 4 },
      daysLeft: 20,
      coins: 400
    }
  ];
  
  // Datos de recompensas
  rewards: Reward[] = [
    {
      id: 1,
      title: '5€ Frutas/Verduras',
      location: 'Mercado Central',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.31.50.png',
      coins: 200,
      category: 'Mercado Central',
      displayTitle: false,
      redeemed: false
    },
    {
      id: 2,
      title: 'Degustación Jamón',
      location: 'Mercado Ruzafa',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.07.png',
      coins: 350,
      category: 'Mercado Ruzafa',
      displayTitle: false,
      redeemed: false
    },
    {
      id: 3,
      title: 'Pack Snacks Asiáticos',
      location: 'Asia Market',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.40.png',
      coins: 150,
      category: 'Tiendas Chinas',
      displayTitle: false,
      redeemed: false
    },
    {
      id: 4,
      title: '10€ Pescado Fresco',
      location: 'Mercado Central',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.20.png',
      coins: 400,
      category: 'Mercado Central',
      displayTitle: false,
      redeemed: false
    },
    {
      id: 5,
      title: 'Wok + Utensilios',
      location: 'Chen\'s Bazar',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.51.png',
      coins: 300,
      category: 'Tiendas Chinas',
      displayTitle: false,
      redeemed: false
    },
    {
      id: 6,
      title: 'Pack Especias',
      location: 'Mercado Ruzafa',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.33.02.png',
      coins: 250,
      category: 'Mercado Ruzafa',
      displayTitle: false,
      redeemed: false
    }
  ];
  
  selectedRewardCategory = 'Todos';
  rewardCategories = ['Todos', 'Mercado Central', 'Mercado Ruzafa', 'Tiendas Chinas', 'Otros Mercados'];

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private vlcoinService: VlcoinService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      close,
      helpCircleOutline,
      timeOutline,
      starOutline,
      walletOutline,
      bagOutline,
      storefront,
      storefrontOutline,
      personOutline,
      ribbonOutline,
      trophyOutline,
      medalOutline,
      checkmarkCircleOutline,
      checkmarkDoneCircleOutline,
      checkmarkCircle,
      shieldCheckmark,
      giftOutline,
      arrowForwardOutline,
      shareOutline,
      cart,
      cartOutline,
      'basket-outline': basketOutline,
      basket,
      star,
      person,
      personCircle: personCircle,
      globe,
      globeOutline,
      share,
      'chatbubble-outline': chatbubbleOutline,
      thumbsUp,
      mapOutline,
      locationOutline,
      pin,
      pinOutline,
      'compass-outline': compassOutline,
      compass,
      sunny,
      moon
    });
  }

  ngOnInit() {
    // Obtener el saldo real del servicio de VLCoin
    this.vlcoinService.vlcoinBalance$.subscribe(balance => {
      this.vlcoinBalance = balance;
    });
    
    // Inicializar datos de usuario actual
    this.authService.user$.subscribe(async user => {
      if (user && user.id) {
        // Actualizar el saldo desde la base de datos
        await this.vlcoinService.getVlcoinBalance(user.id);
      }
    });
  }
  
  // Método para cambiar de segmento
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }
  
  // Método para filtrar recompensas por categoría
  selectRewardCategory(category: string) {
    this.selectedRewardCategory = category;
  }
  
  // Método para obtener las recompensas filtradas
  get filteredRewards() {
    if (this.selectedRewardCategory === 'Todos') {
      return this.rewards;
    }
    return this.rewards.filter(reward => reward.category === this.selectedRewardCategory);
  }
  
  // Método para participar en un reto
  async participateInChallenge(challengeId: number) {
    console.log('Participando en reto:', challengeId);
    
    // Buscar el reto por ID
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (!challenge) return;
    
    // Actualizar el estado del reto para mostrar como "participando"
    challenge.progress.current = 1; // Marca al menos 1 como completado
    
    // Si es el reto del Mercado Central (ID 1), mostrar un mensaje de éxito
    if (challengeId === 1) {
      const toast = await this.toastCtrl.create({
        message: '¡Te has unido al Reto del Mercado Central!',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    }
    
    // Forzar actualización de la UI
    this.challenges = [...this.challenges];
  }
  
  // Método para canjear una recompensa  
  async redeemReward(rewardId: number, event?: any) {    
    console.log('Canjeando recompensa:', rewardId);    
    
    // Buscar la recompensa seleccionada    
    const reward = this.rewards.find(r => r.id === rewardId);    
    if (!reward) return;    
    
    // Verificar que hay saldo suficiente    
    if (this.vlcoinBalance < reward.coins) {      
      const errorToast = await this.toastCtrl.create({        
        message: `No tienes suficientes VLCoins para canjear esta recompensa`,        
        duration: 2000,        
        position: 'bottom',        
        color: 'danger'      
      });      
      await errorToast.present();      
      return;    
    }    
    
    // Marcar como canjeado    
    reward.redeemed = true;    
    
    // Actualizar el saldo visual con animación    
    this.animateVLCoinDecrease(reward.coins);    
    
    // Mostrar mensaje de éxito    
    const toast = await this.toastCtrl.create({      
      message: `¡Has canjeado con éxito ${reward.title} en ${reward.location}!`,      
      duration: 2500,      
      position: 'bottom',      
      color: 'success'    
    });    
    await toast.present();    
    
    // Forzar actualización de la UI para que se reflejen los cambios    
    this.rewards = [...this.rewards];  
  }    
  
  // Método para animar la disminución de VLCoins  
  private animateVLCoinDecrease(amount: number) {    
    // Guardar el valor original para la animación    
    const startValue = this.vlcoinBalance;    
    const endValue = startValue - amount;    
    const duration = 1000; // 1 segundo de duración    
    const fps = 60; // Frames por segundo    
    const steps = duration / 1000 * fps; // Cantidad de pasos en la animación    
    const decrementPerStep = amount / steps; // Cuánto decrementar en cada paso    
    
    // Obtener el elemento donde se muestra el saldo para añadir efectos visuales    
    const balanceElement = document.querySelector('.balance-text');    
    if (balanceElement) {      
      balanceElement.classList.add('updating-balance');    
    }    
    
    let currentStep = 0;    
    
    // Usar interval para animar    
    const intervalId = setInterval(() => {      
      currentStep++;      
      
      if (currentStep <= steps) {        
        // Calcular y actualizar el valor actual        
        this.vlcoinBalance = Math.round(startValue - (decrementPerStep * currentStep));      
      } else {        
        // Asegurar que el valor final sea exacto        
        this.vlcoinBalance = endValue;        
        
        // Remover clase de animación        
        if (balanceElement) {          
          balanceElement.classList.remove('updating-balance');          
          balanceElement.classList.add('balance-updated');          
          setTimeout(() => {            
            balanceElement.classList.remove('balance-updated');          
          }, 300);        
        }        
        
        // Detener el interval        
        clearInterval(intervalId);      
      }    
    }, 1000 / fps);  
  }
  
  // Método para cerrar el modal
  dismissModal(balanceUpdated: boolean = false) {
    this.modalCtrl.dismiss({
      balanceUpdated
    });
  }
} 