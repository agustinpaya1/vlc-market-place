/**
 * Utilidades mejoradas para navegación confiable
 * Este archivo contiene funciones que ayudan a evitar problemas comunes
 * de navegación en aplicaciones Angular e Ionic
 */

// Objeto para controlar tiempos y timestamps
export const NavigationControl = {
  lastTimestamp: 0,
  urlCache: new Map<string, string>(),
  
  /**
   * Genera una URL de tracking estable que evita el error
   * ExpressionChangedAfterItHasBeenCheckedError 
   */
  getTrackingUrl(orderId: string, refresh = false): string {
    if (!orderId) {
      console.error('Error: Se intentó generar URL sin ID de pedido');
      return '/tabs/stores';
    }
    
    // Si ya tenemos una URL cacheada para este orderId y no se pidió refresh, la usamos
    const cacheKey = `tracking_${orderId}`;
    if (!refresh && this.urlCache.has(cacheKey)) {
      const cachedUrl = this.urlCache.get(cacheKey);
      if (cachedUrl) return cachedUrl;
    }
    
    // Si no existe la URL o se pidió refresh, creamos una nueva
    const baseUrl = window.location.origin;
    
    // Usamos un timestamp que no cambia durante la sesión para evitar problemas de detección de cambios
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = Date.now();
    }
    
    const url = `${baseUrl}/tabs/order-tracking/${orderId}?force=true&t=${this.lastTimestamp}`;
    
    // Guardamos en caché
    this.urlCache.set(cacheKey, url);
    
    return url;
  },
  
  /**
   * Prepara la sesión antes de navegar
   */
  prepareSession(orderId: string): void {
    if (!orderId) return;
    
    sessionStorage.setItem('lastOrderId', orderId);
    sessionStorage.setItem('forceOrderTracking', 'true');
    sessionStorage.setItem('navigationTimestamp', new Date().toISOString());
  },
  
  /**
   * Navega directamente a la página de tracking de forma segura
   */
  navigateToOrderTracking(orderId: string): void {
    if (!orderId) {
      console.error('Error: Se intentó navegar a seguimiento sin ID de pedido');
      return;
    }
    
    // Preparar sesión
    this.prepareSession(orderId);
    
    // Obtener URL y navegar
    const url = this.getTrackingUrl(orderId);
    console.log('Navegando a:', url);
    
    // Usar setTimeout para salir del ciclo de detección de cambios de Angular
    setTimeout(() => {
      window.location.href = url;
    }, 10);
  }
}

/**
 * Función de navegación al seguimiento de pedidos
 * Esta es la función que se importa en los componentes
 */
export function navigateToOrderTracking(orderId: string): void {
  // Delegar en el objeto NavigationControl para evitar errores de Angular
  NavigationControl.navigateToOrderTracking(orderId);
}

// Función para volver a la página principal
export function navigateToHome(): void {
  try {
    console.log('Navegando a la página principal');
    window.location.href = '/tabs/stores';
  } catch (error) {
    console.error('Error al navegar a la página principal:', error);
    // Recargar la página como último recurso
    window.location.reload();
  }
}
