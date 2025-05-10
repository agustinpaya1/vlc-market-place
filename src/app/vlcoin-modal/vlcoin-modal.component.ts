import { Component, OnInit } from '@angular/core';
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
  IonCardHeader, 
  IonCardContent,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonProgressBar,
  IonChip,
  IonRow,
  IonCol,
  IonGrid,
  IonItem,
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
  giftOutline,
  arrowForwardOutline,
  shareOutline,
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
    IonCardHeader, 
    IonCardContent,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonProgressBar,
    IonChip,
    IonRow,
    IonCol,
    IonGrid,
    IonItem
  ]
})
export class VlcoinModalComponent implements OnInit {
  // Propiedades para el estado del modal
  selectedSegment = 'achievements';
  vlcoinBalance = 2450;
  monthlyEarned = 350;
  spent = 120;
  expiring = 200;
  isDarkMode = false;
  
  // Datos de logros
  achievements = [
    {
      id: 1,
      title: 'Primera Compra',
      date: '12 mayo 2025',
      icon: 'bagOutline',
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
      icon: 'starOutline',
      coins: 200,
      completed: false
    },
    {
      id: 4,
      title: 'Perfil Completo',
      date: '28 abril 2025',
      icon: 'personOutline',
      coins: 50,
      completed: true
    },
    {
      id: 5,
      title: 'Compartir en Redes',
      date: '25 abril 2025',
      icon: 'shareOutline',
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
      image: 'assets/images/market-challenge.jpg',
      progress: { current: 0, total: 3 },
      daysLeft: 5,
      coins: 300
    },
    {
      id: 2,
      title: 'Reseñador Experto',
      description: 'Escribe 5 reseñas detalladas con fotos en comercios locales que hayas visitado este mes.',
      image: 'assets/images/review-challenge.jpg',
      progress: { current: 0, total: 5 },
      daysLeft: 12,
      coins: 250
    },
    {
      id: 3,
      title: 'Explorador de Barrios',
      description: 'Visita y compra en 4 tiendas diferentes en el barrio de Ruzafa durante este mes.',
      image: 'assets/images/neighborhood-challenge.jpg',
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
      image: 'assets/images/fruits-reward.jpg',
      coins: 200,
      category: 'Mercado Central',
      displayTitle: false
    },
    {
      id: 2,
      title: 'Degustación Jamón',
      location: 'Mercado Ruzafa',
      image: 'assets/images/ham-reward.jpg',
      coins: 350,
      category: 'Mercado Ruzafa',
      displayTitle: false
    },
    {
      id: 3,
      title: 'Pack Snacks Asiáticos',
      location: 'Asia Market',
      image: 'assets/images/snacks-reward.jpg',
      coins: 150,
      category: 'Tiendas Chinas',
      displayTitle: false
    },
    {
      id: 4,
      title: '10€ Pescado Fresco',
      location: 'Mercado Central',
      image: 'assets/images/fish-reward.jpg',
      coins: 400,
      category: 'Mercado Central',
      displayTitle: false
    },
    {
      id: 5,
      title: 'Wok + Utensilios',
      location: 'Chen\'s Bazar',
      image: 'assets/images/wok-reward.jpg',
      coins: 300,
      category: 'Tiendas Chinas',
      displayTitle: false
    },
    {
      id: 6,
      title: 'Pack Especias',
      location: 'Mercado Ruzafa',
      image: 'assets/images/spices-reward.jpg',
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
      personOutline,
      ribbonOutline,
      trophyOutline,
      medalOutline,
      checkmarkCircleOutline,
      checkmarkDoneCircleOutline,
      giftOutline,
      arrowForwardOutline,
      shareOutline,
      sunny,
      moon
    });
    
    // Detectar el modo oscuro del sistema
    this.checkDarkMode();
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
  
  // Comprobar si el modo oscuro está activado en el sistema
  private checkDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.isDarkMode = prefersDark.matches;
    this.applyDarkMode();
    
    // Escuchar cambios en la preferencia del sistema
    prefersDark.addEventListener('change', (mediaQuery) => {
      this.isDarkMode = mediaQuery.matches;
      this.applyDarkMode();
    });
  }
  
  // Alternar entre modo claro y oscuro
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.applyDarkMode();
  }
  
  // Aplicar el modo oscuro al cuerpo del documento
  private applyDarkMode() {
    document.body.classList.toggle('dark', this.isDarkMode);
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