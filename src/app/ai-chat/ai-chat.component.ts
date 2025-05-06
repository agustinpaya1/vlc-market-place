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
    private modalController: ModalController
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

  // Método para enviar un mensaje
  async sendMessage() {
    if (!this.userMessage.trim()) return;
    
    const message = this.userMessage.trim();
    this.userMessage = ''; // Limpiar el input
    
    // No añadimos el mensaje de usuario aquí, ya lo hace el servicio
    
    this.isLoading = true;
    
    // Enviar mensaje y recibir respuesta
    this.aiChatService.sendMessage(message).subscribe({
      next: (response) => {
        console.log('Response received:', response);
        this.isLoading = false;
        
        // Actualizar el chat local con la respuesta
        this.chatMessages = this.aiChatService.getChatHistory();
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error al enviar mensaje:', error);
        this.isLoading = false;
        
        // Mostrar mensaje de error en el chat
        this.chatMessages.push({
          role: 'assistant',
          content: 'Ha ocurrido un error al comunicarse con la IA. Por favor intenta nuevamente.',
          timestamp: new Date()
        });
        
        this.scrollToBottom();
      }
    });
    
    // Actualizar de inmediato para mostrar el mensaje del usuario
    this.chatMessages = this.aiChatService.getChatHistory();
    this.scrollToBottom();
    
    // Enfoque en el input después de enviar
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