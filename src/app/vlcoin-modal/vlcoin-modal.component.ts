import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
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
  IonGrid,
  ModalController
} from '@ionic/angular/standalone';
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
  rewards = [
    {
      id: 1,
      title: '5€ Frutas/Verduras',
      location: 'Mercado Central',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.31.50.png',
      coins: 200,
      category: 'Mercado Central',
      displayTitle: false
    },
    {
      id: 2,
      title: 'Degustación Jamón',
      location: 'Mercado Ruzafa',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.07.png',
      coins: 350,
      category: 'Mercado Ruzafa',
      displayTitle: false
    },
    {
      id: 3,
      title: 'Pack Snacks Asiáticos',
      location: 'Asia Market',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.40.png',
      coins: 150,
      category: 'Tiendas Chinas',
      displayTitle: false
    },
    {
      id: 4,
      title: '10€ Pescado Fresco',
      location: 'Mercado Central',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.20.png',
      coins: 400,
      category: 'Mercado Central',
      displayTitle: false
    },
    {
      id: 5,
      title: 'Wok + Utensilios',
      location: 'Chen\'s Bazar',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.32.51.png',
      coins: 300,
      category: 'Tiendas Chinas',
      displayTitle: false
    },
    {
      id: 6,
      title: 'Pack Especias',
      location: 'Mercado Ruzafa',
      image: 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/recompensas//Screenshot%202025-05-10%20at%2022.33.02.png',
      coins: 250,
      category: 'Mercado Ruzafa',
      displayTitle: false
    }
  ];
  
  selectedRewardCategory = 'Todos';
  rewardCategories = ['Todos', 'Mercado Central', 'Mercado Ruzafa', 'Tiendas Chinas', 'Otros Mercados'];

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private vlcoinService: VlcoinService
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
    // Implementar lógica para participar en reto
  }
  
  // Método para canjear una recompensa
  async redeemReward(rewardId: number) {
    console.log('Canjeando recompensa:', rewardId);
    
    // Buscar la recompensa seleccionada
    const reward = this.rewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    // Obtener el usuario actual
    const user = await this.authService.user$.toPromise();
    if (!user || !user.id) return;
    
    // Verificar si tiene suficientes VLCoins
    if (this.vlcoinBalance < reward.coins) {
      console.error('No tienes suficientes VLCoins para canjear esta recompensa');
      return;
    }
    
    // Restar VLCoins (ejemplo de implementación)
    const success = await this.vlcoinService.subtractVlcoins(user.id, reward.coins);
    if (success) {
      console.log(`Recompensa canjeada: ${reward.title}`);
      // Aquí se implementaría lógica adicional como guardar el canje en la base de datos,
      // emitir un comprobante, etc.
      
      // Mostrar un mensaje de éxito y cerrar el modal con la información de que se actualizó el balance
      setTimeout(() => this.dismissModal(true), 1500);
    }
  }

  // Método para cerrar el modal
  dismissModal(balanceUpdated: boolean = false) {
    this.modalCtrl.dismiss({
      balanceUpdated
    });
  }
} 