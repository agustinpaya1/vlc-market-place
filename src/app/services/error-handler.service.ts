import { Injectable, ErrorHandler } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {

  constructor() { }
  
  handleError(error: any): void {
    // Ignora los errores específicos del NavigatorLock
    if (error.toString().includes('NavigatorLockAcquireTimeoutError') || 
        error.toString().includes('lock:sb-')) {
      console.debug('Ignorando error de NavigatorLock:', error);
      return;
    }
    
    // Maneja otros errores
    console.error('Error global:', error);
  }
} 