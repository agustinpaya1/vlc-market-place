import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  personCircle, 
  pencil, 
  logOut, 
  settings, 
  heart, 
  bag, 
  calendar, 
  receipt, 
  callOutline, 
  locationOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  user = {
    name: 'Usuario',
    email: 'usuario@example.com',
    phone: '+34 600 123 456',
    address: 'Calle Valencia, 123, Valencia'
  };

  isAuthenticated = false;

  menuItems = [
    { icon: 'bag', label: 'Mis Pedidos', route: '/tabs/orders' },
    { icon: 'heart', label: 'Favoritos', route: '/tabs/favorites' },
    { icon: 'receipt', label: 'Facturas', route: '/tabs/invoices' },
    { icon: 'settings', label: 'Configuración', route: '/tabs/settings' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({
      personCircle,
      pencil,
      logOut,
      settings,
      heart,
      bag,
      calendar,
      receipt,
      callOutline,
      locationOutline
    });
  }

  ngOnInit() {
    console.log('ProfilePage - ngOnInit');
    // Comprobar si el usuario está autenticado
    this.authService.user$.subscribe(user => {
      console.log('ProfilePage - Usuario recibido:', user);
      this.isAuthenticated = !!user;
      if (user) {
        this.loadUserData(user);
      }
    });
  }

  loadUserData(user: any) {
    console.log('ProfilePage - Cargando datos de usuario:', user);
    // En un caso real, cargaríamos los datos del usuario desde el servicio
    if (user.displayName) {
      this.user.name = user.displayName;
    } else if (user.email) {
      // Usar el email como nombre si no hay displayName
      this.user.name = user.email.split('@')[0];
    }
    if (user.email) {
      this.user.email = user.email;
    }
  }

  editProfile() {
    // Navegar a la página de edición de perfil
    this.router.navigate(['/tabs/edit-profile']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
} 