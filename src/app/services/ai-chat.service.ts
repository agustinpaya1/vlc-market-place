import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private apiKey = environment.GEMINI_API_KEY || '';
  private chatHistory: ChatMessage[] = [];

  constructor(private http: HttpClient) {}

  // Enviar un mensaje al modelo de IA y recibir respuesta
  sendMessage(message: string): Observable<string> {
    // Guardar mensaje del usuario en el historial
    this.addMessageToHistory('user', message);
    
    // Componer el cuerpo de la solicitud según la documentación de Gemini API
    const requestBody = {
      contents: this.formatMessages()
    };

    // Configurar los headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Sending request to Gemini API:', requestBody);

    // Realizar la solicitud HTTP
    return this.http.post<any>(
      `${this.apiUrl}?key=${this.apiKey}`,
      requestBody,
      { headers }
    ).pipe(
      map(response => {
        console.log('Received response from Gemini API:', response);
        // Extraer la respuesta del modelo
        const aiResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude procesar tu solicitud.';
        
        // Guardar respuesta en el historial
        this.addMessageToHistory('assistant', aiResponse);
        
        return aiResponse;
      }),
      catchError(error => {
        console.error('Error en la comunicación con Google AI:', error);
        return of('Ha ocurrido un error al comunicarse con la IA. Por favor intenta nuevamente.');
      })
    );
  }

  // Obtener todo el historial de chat
  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  // Limpiar el historial de chat
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  // Añadir un mensaje al historial
  private addMessageToHistory(role: 'user' | 'assistant', content: string): void {
    this.chatHistory.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  // Formatear los mensajes para la API de Gemini
  private formatMessages() {
    // Convertir historial a formato Gemini API
    const formattedMessages = [];
    
    for (let i = 0; i < this.chatHistory.length; i++) {
      const message = this.chatHistory[i];
      
      formattedMessages.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      });
    }
    
    return formattedMessages;
  }
} 