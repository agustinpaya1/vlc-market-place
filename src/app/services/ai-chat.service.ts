import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';

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
  private systemPrompt: string = '';

  constructor(private http: HttpClient, private supabaseService: SupabaseService) {
    this.initSystemPrompt();
  }

  // Inicializar el prompt de sistema con contexto y ejemplos
  private async initSystemPrompt() {
    // Intentar cargar de localStorage para evitar llamadas repetidas
    const cached = localStorage.getItem('ai_system_prompt');
    if (cached) {
      this.systemPrompt = cached;
      return;
    }
    // Obtener tiendas y categorías
    let tiendas: any[] = [];
    let productos: any[] = [];
    try {
      tiendas = await this.supabaseService.getStores();
      productos = await this.supabaseService.getAllProductsWithStockAndStore();
    } catch (e) {
      tiendas = [];
      productos = [];
    }
    const resumenTiendas = tiendas.map(t => `- ${t.name}${t.categories ? ' (' + t.categories.join(', ') + ')' : ''}${t.description ? ': ' + t.description : ''}`).join('\n');
    const categorias = Array.from(new Set(tiendas.flatMap(t => t.categories || [])));
    const resumenProductos = productos.map(p => `- ${p.name} (${p.stock} unidades) en ${p.store}${p.price ? ' (' + p.price + '€)' : ''}`).join('\n');
    this.systemPrompt = `Eres un asistente para un marketplace de tiendas locales en Valencia.\n` +
      `SOLO puedes recomendar tiendas y productos que aparecen en la lista que te proporciono a continuación, y que tienen stock disponible.\n` +
      `Si el producto que te preguntan NO está en la lista de productos y stock, responde exactamente: 'No hay stock de ese producto en nuestra app'.\n` +
      `No inventes tiendas ni productos. No menciones supermercados, grandes superficies ni mercados municipales.\n` +
      `Cuando te pregunten por un producto, responde SOLO con las tiendas donde el stock sea mayor que 0. Si no hay stock en ninguna tienda, dilo claramente y no sugieras buscar en otro sitio.\n` +
      `Siempre responde con el stock disponible y la tienda exacta donde se puede comprar dentro de la app.\n` +
      `Si no hay stock, indícalo claramente.\n` +
      `Puedes ayudar a los usuarios a buscar tiendas, productos, categorías, resolver dudas sobre horarios, ofertas, stock, etc.\n` +
      `Ejemplos:\n` +
      `Usuario: ¿Dónde puedo comprar pan?\n` +
      `Asistente: Puedes comprar pan en Panadería La Hogaza (8 unidades disponibles) directamente desde esta app.\n` +
      `Usuario: ¿Dónde hay leche disponible?\n` +
      `Asistente: El producto "leche" está disponible en Lácteos El Pasturage (10 unidades) y Ecotienda Verde (5 unidades). Puedes comprarlo aquí mismo.\n` +
      `Usuario: ¿Dónde hay tomates?\n` +
      `Asistente: No hay stock de ese producto en nuestra app.\n` +
      `Usuario: ¿Dónde puedo comprar aceite?\n` +
      `Asistente: No hay stock de ese producto en nuestra app.\n` +
      `Usuario: ¿Dónde puedo comprar aceite?\n` +
      `Asistente (INCORRECTO, NO HAGAS ESTO): Puedes encontrar aceite en Mercadona, Carrefour o el Mercado Central.\n` +
      `Tiendas disponibles:\n${resumenTiendas}\n` +
      `Productos y stock (solo productos con stock disponible):\n${resumenProductos}\n` +
      `Categorías: ${categorias.join(', ')}\n` +
      `Responde de forma clara, útil y SIEMPRE invita a comprar desde la app. Nunca digas 'es posible que haya', solo responde con datos reales.`;
    localStorage.setItem('ai_system_prompt', this.systemPrompt);
  }

  // Permitir refrescar el contexto manualmente
  public async refreshSystemPrompt() {
    localStorage.removeItem('ai_system_prompt');
    await this.initSystemPrompt();
  }

  // Enviar un mensaje al modelo de IA y recibir respuesta
  sendMessage(message: string): Observable<string> {
    // Guardar mensaje del usuario en el historial
    this.addMessageToHistory('user', message);
    
    // Componer el cuerpo de la solicitud según la documentación de Gemini API
    const requestBody = {
      contents: this.formatMessagesWithSystemPrompt()
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

  // Formatear los mensajes para la API de Gemini, añadiendo el prompt de sistema al inicio
  private formatMessagesWithSystemPrompt() {
    const formattedMessages = [];
    if (this.systemPrompt) {
      formattedMessages.push({
        role: 'model',
        parts: [{ text: this.systemPrompt }]
      });
    }
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