import { Component, OnInit, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import { AiChatService, ChatMessage } from '../services/ai-chat.service';
import { addIcons } from 'ionicons';
import { 
  sendOutline, 
  closeOutline, 
  trashOutline, 
  micOutline,
  imageOutline,
  analyticsOutline
} from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonIcon,
    IonContent,
    IonFooter,
    IonInput,
    IonSpinner
  ]
})
export class AiChatComponent implements OnInit {
  @ViewChild('chatContent') private chatContent!: IonContent;
  @ViewChild('messageInput') messageInput!: IonInput;
  
  userMessage: string = '';
  isLoading: boolean = false;
  chatMessages: ChatMessage[] = [];
  private lastProductQuery: string | null = null;
  private lastShownProductIds: Set<string> = new Set();
  private lastRelatedProducts: any[] = [];

  // Lista básica de categorías comunes
  private static readonly COMMON_CATEGORIES = [
    'frutas', 'verduras', 'vinos', 'quesos', 'lácteos', 'pan', 'carnes', 'pescados', 'gourmet', 'delicatessen', 'orgánicos', 'panadería', 'pescadería', 'carnicería', 'lacteos', 'panaderia', 'pescaderia', 'carniceria'
  ];

  constructor(
    private aiChatService: AiChatService,
    private modalController: ModalController,
    private supabaseService: SupabaseService
  ) {
    addIcons({
      sendOutline,
      closeOutline,
      trashOutline,
      micOutline,
      imageOutline,
      analyticsOutline
    });
  }

  ngOnInit() {
    // Cargar historial de chat si existe
    this.chatMessages = this.aiChatService.getChatHistory();
    
    // Si no hay mensajes, mostrar un mensaje de bienvenida
    if (this.chatMessages.length === 0) {
      this.chatMessages.push({
        role: 'assistant',
        content: '¡Hola! Soy Pipa, tu asistente de IA. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      });
    }
  }

  // Función para normalizar texto (sin tildes, minúsculas)
  normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9áéíóúñü\s]/gi, '')
      .trim();
  }

  // Función de distancia de Levenshtein
  levenshtein(a: string, b: string): number {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = [];
    for (let i = 0; i <= bn; ++i) matrix[i] = [i];
    for (let j = 0; j <= an; ++j) matrix[0][j] = j;
    for (let i = 1; i <= bn; ++i) {
      for (let j = 1; j <= an; ++j) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // sustitución
            matrix[i][j - 1] + 1,     // inserción
            matrix[i - 1][j] + 1      // borrado
          );
        }
      }
    }
    return matrix[bn][an];
  }

  // Extraer la palabra clave principal de la consulta del usuario
  private extractMainKeyword(text: string): string {
    // Eliminar palabras comunes y quedarse con la última palabra relevante
    const stopwords = ['quiero', 'comprar', 'un', 'una', 'buen', 'buena', 'de', 'el', 'la', 'los', 'las', 'en', 'para', 'me', 'gustaría', 'busco', 'dame', 'muéstrame', 'hay', 'tienes', 'tienen', 'puedo', 'dónde', 'donde', 'más', 'otro', 'otra', 'algún', 'alguna', 'alguno', 'algun', 'algunas', 'algunos', 'y', 'por', 'favor', 'porfavor', 'del', 'con', 'sin', 'mejor', 'mejores', 'me', 'quiero', 'ver', 'oferta', 'ofertas', 'ofrecen', 'ofreces', 'ofrecer'];
    const palabras = this.normalizeText(text).split(/\s+/).filter(Boolean);
    const keywords = palabras.filter(p => !stopwords.includes(p));
    return keywords.length > 0 ? keywords[keywords.length - 1] : palabras[palabras.length - 1] || '';
  }

  // Método para enviar un mensaje
  async sendMessage() {
    if (!this.userMessage.trim()) return;
    const message = this.userMessage.trim();
    this.userMessage = '';
    this.isLoading = true;

    // Detectar si la pregunta es de seguimiento
    const followUpRegex = /(no hay m[aá]s|alguno m[aá]s|otro|y otro|y alguno m[aá]s|y m[aá]s|alg[úu]n otro|más opciones|otra opción|otra alternativa|otra marca|otra variedad|hay m[aá]s [a-z]+)/i;
    const mainKeyword = this.extractMainKeyword(message);
    const isCategory = AiChatComponent.COMMON_CATEGORIES.includes(mainKeyword);
    if (followUpRegex.test(message) && this.lastProductQuery) {
      // Si la pregunta de seguimiento contiene una categoría, hacer nueva búsqueda de esa categoría
      if (isCategory) {
        const productos = await this.supabaseService.getAllProductsWithStockAndStore();
        const encontrados = productos.filter(p => this.normalizeText(String(('category' in p ? p.category : ''))) === mainKeyword);
        this.lastProductQuery = mainKeyword;
        this.lastRelatedProducts = encontrados;
        this.lastShownProductIds = new Set(encontrados.map(p => p.id));
        if (encontrados.length > 0) {
          const respuesta = encontrados.map(p => `"${p.name}" está disponible en ${p.store} (${p.stock} unidades)`).join('\n');
          this.chatMessages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
          });
          this.chatMessages.push({
            role: 'assistant',
            content: respuesta,
            timestamp: new Date()
          });
          this.isLoading = false;
          this.scrollToBottom();
          return;
        } else {
          this.chatMessages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
          });
          this.chatMessages.push({
            role: 'assistant',
            content: 'No hay stock de ese producto en nuestra app.',
            timestamp: new Date()
          });
          this.isLoading = false;
          this.scrollToBottom();
          return;
        }
      }
      // Si no, seguir con la lógica de seguimiento anterior
      let encontrados: any[] = [];
      if (isCategory) {
        encontrados = this.lastRelatedProducts.filter(p => this.normalizeText(String(('category' in p ? p.category : ''))) === mainKeyword);
      } else {
        encontrados = this.lastRelatedProducts.filter(p => this.normalizeText(p.name).includes(mainKeyword));
      }
      // Filtrar los que ya se han mostrado
      const nuevos = encontrados.filter(p => !this.lastShownProductIds.has(p.id));
      if (nuevos.length > 0) {
        nuevos.forEach(p => this.lastShownProductIds.add(p.id));
        const respuesta = nuevos.map(p => `"${p.name}" está disponible en ${p.store} (${p.stock} unidades)`).join('\n');
        this.chatMessages.push({
          role: 'user',
          content: message,
          timestamp: new Date()
        });
        this.chatMessages.push({
          role: 'assistant',
          content: respuesta,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
        return;
      } else {
        this.chatMessages.push({
          role: 'user',
          content: message,
          timestamp: new Date()
        });
        this.chatMessages.push({
          role: 'assistant',
          content: 'No hay más productos disponibles relacionados con tu búsqueda.',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
        return;
      }
    }

    // Detectar si la pregunta es sobre stock/disponibilidad de producto
    const stockRegex = /(hay|disponible|stock|d[oó]nde|puedo comprar|queda|quedan|tienen|tiene|venden|vende|encontrar|buscar).*([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9 ]+)/i;
    const match = message.match(stockRegex);
    if (match) {
      this.lastProductQuery = mainKeyword;
      const productos = await this.supabaseService.getAllProductsWithStockAndStore();
      let encontrados: any[] = [];
      if (isCategory) {
        encontrados = productos.filter(p => this.normalizeText(String(('category' in p ? p.category : ''))) === mainKeyword);
      } else {
        encontrados = productos.filter(p => this.normalizeText(p.name).includes(mainKeyword));
      }
      this.lastShownProductIds = new Set(encontrados.map(p => p.id));
      this.lastRelatedProducts = encontrados;
      if (encontrados.length > 0) {
        const respuesta = encontrados.map(p => `"${p.name}" está disponible en ${p.store} (${p.stock} unidades)`).join('\n');
        this.chatMessages.push({
          role: 'user',
          content: message,
          timestamp: new Date()
        });
        this.chatMessages.push({
          role: 'assistant',
          content: respuesta,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
        return;
      } else {
        this.chatMessages.push({
          role: 'user',
          content: message,
          timestamp: new Date()
        });
        this.chatMessages.push({
          role: 'assistant',
          content: 'No hay stock de ese producto en nuestra app.',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
        return;
      }
    } else {
      this.lastProductQuery = null;
      this.lastShownProductIds = new Set();
      this.lastRelatedProducts = [];
    }
    // Si no es pregunta de stock, enviar a la IA
    this.aiChatService.sendMessage(message).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.chatMessages = this.aiChatService.getChatHistory();
        this.scrollToBottom();
      },
      error: (error) => {
        this.isLoading = false;
        this.chatMessages.push({
          role: 'assistant',
          content: 'Ha ocurrido un error al comunicarse con la IA. Por favor intenta nuevamente.',
          timestamp: new Date()
        });
        this.scrollToBottom();
      }
    });
    this.chatMessages = this.aiChatService.getChatHistory();
    this.scrollToBottom();
    setTimeout(() => {
      this.messageInput?.setFocus();
    }, 100);
  }

  // Cerrar el chat
  dismissModal() {
    this.modalController.dismiss();
  }

  // Limpiar todo el historial de chat
  clearChat() {
    this.aiChatService.clearChatHistory();
    this.chatMessages = [{
      role: 'assistant',
      content: '¡Hola! Soy Pipa, tu asistente de IA. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }];
  }

  // Hacer scroll hacia abajo al recibir nuevos mensajes
  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContent) {
        this.chatContent.scrollToBottom(300);
      }
    }, 100);
  }
} 