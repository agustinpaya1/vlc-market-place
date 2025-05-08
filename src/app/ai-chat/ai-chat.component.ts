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
  imageOutline
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
      imageOutline
    });
  }

  ngOnInit() {
    // Cargar historial de chat si existe
    this.chatMessages = this.aiChatService.getChatHistory();
    
    // Si no hay mensajes, mostrar un mensaje de bienvenida
    if (this.chatMessages.length === 0) {
      this.chatMessages.push({
        role: 'assistant',
        content: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
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

  // Método para enviar un mensaje
  async sendMessage() {
    if (!this.userMessage.trim()) return;
    const message = this.userMessage.trim();
    this.userMessage = '';
    this.isLoading = true;

    // Detectar si la pregunta es sobre stock/disponibilidad de producto
    const stockRegex = /(hay|disponible|stock|d[oó]nde|puedo comprar|queda|quedan|tienen|tiene|venden|vende|encontrar|buscar).*([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9 ]+)/i;
    const match = message.match(stockRegex);
    if (match) {
      const productos = await this.supabaseService.getAllProductsWithStockAndStore();
      const consulta = this.normalizeText(message);
      const consultaPalabras = consulta.split(/\s+/).filter(Boolean);
      // Buscar coincidencias fuzzy o palabra contenida
      const encontrados = productos.filter(p => {
        const nombre = this.normalizeText(p.name);
        // Coincidencia fuzzy global
        if (
          consulta.includes(nombre) ||
          nombre.includes(consulta) ||
          this.levenshtein(consulta, nombre) <= 2 ||
          this.levenshtein(nombre, consulta) <= 2
        ) {
          return true;
        }
        // Coincidencia por palabra: ¿alguna palabra de la consulta está en el nombre del producto?
        return consultaPalabras.some(pal => nombre.includes(pal));
      });
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
      content: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
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