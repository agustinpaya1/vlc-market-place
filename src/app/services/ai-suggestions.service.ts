import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiSuggestionsService {
  // Categorías predefinidas para combinar con términos de búsqueda
  private categories = [
    'Frutas', 'Verduras', 'Carnes', 'Lácteos', 'Bebidas', 'Gourmet',
    'Orgánico', 'Local', 'Panadería', 'Pescado', 'Dulces', 'Congelados'
  ];

  // Productos populares para generar sugerencias
  private popularProducts = [
    'Aceite de oliva', 'Pan fresco', 'Queso manchego', 'Jamón ibérico',
    'Tomates', 'Manzanas', 'Leche', 'Yogur', 'Café', 'Vino', 'Chocolate',
    'Arroz', 'Pasta', 'Huevos', 'Pollo', 'Ternera', 'Pescado', 'Merluza'
  ];

  constructor() {}

  /**
   * Obtiene sugerencias de búsqueda basadas en el término de búsqueda
   */
  getSuggestions(query: string): Observable<string[]> {
    console.log('Servicio recibió petición para:', query);
    if (!query || query.length < 2) {
      console.log('Consulta muy corta, no se generan sugerencias');
      return of([]);
    }
    
    // Usar sugerencias locales
    const suggestions = this.generateLocalSuggestions(query);
    console.log('Sugerencias generadas localmente:', suggestions);
    return of(suggestions);
  }

  /**
   * Genera sugerencias locales
   */
  private generateLocalSuggestions(query: string): string[] {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();
    const suggestions: string[] = [];
    
    // 1. Sugerencias con productos populares
    this.popularProducts.forEach(product => {
      if (product.toLowerCase().includes(lowerQuery) && 
          suggestions.length < 5) {
        suggestions.push(product);
      }
    });

    // 2. Combinar con categorías
    if (suggestions.length < 5) {
      this.categories.forEach(category => {
        if (category.toLowerCase().includes(lowerQuery) && 
            suggestions.length < 5) {
          suggestions.push(category);
        } else if (suggestions.length < 5 && lowerQuery.length > 3) {
          // Sugerir combinaciones
          suggestions.push(`${category} ${query}`);
        }
      });
    }

    // 3. Sugerencias contextuales basadas en patrones
    if (lowerQuery.includes('fresco') || lowerQuery.includes('fresh')) {
      suggestions.push('Productos frescos del día');
    }
    
    if (lowerQuery.includes('oferta') || lowerQuery.includes('descuento')) {
      suggestions.push('Ofertas especiales');
    }
    
    if (lowerQuery.includes('local') || lowerQuery.includes('valencia')) {
      suggestions.push('Productos locales de Valencia');
    }

    // Limitar a 5 sugerencias y eliminar duplicados
    return [...new Set(suggestions)].slice(0, 5);
  }
} 