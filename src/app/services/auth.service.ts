import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  email: string;
  fullName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user = new BehaviorSubject<User | null>(null);
  public user$ = this.user.asObservable();

  constructor() {
    //Verificar si hay un usuario almacenado en el localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.next(JSON.parse(savedUser));
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      //Aquí normalmente harías una llamada a tu API para autenticar al usuario
      //por ahora, simularemos una autenticación exitosa
      if (email && password) {
        const user: User = {
          id: '1',
          email: email,
          fullName: 'Usuario de Prueba'
        };
        localStorage.setItem('user', JSON.stringify(user));
        this.user.next(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }
  async register(fullName: string, email: string, password: string): Promise<boolean> {
    try {
      // Aquí normalmente harías una llamada a tu API
      // Por ahora simularemos una respuesta exitosa
      if (fullName && email && password) {
        const user: User = {
          id: '1',
          email: email,
          fullName: fullName
        };

        localStorage.setItem('user', JSON.stringify(user));
        this.user.next(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }
  async logout(): Promise<void> {
    localStorage.removeItem('user');
    this.user.next(null);
  }

  isAuthenticated(): boolean {
    return this.user.value !== null;
  }
}
