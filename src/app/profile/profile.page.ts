import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
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
  locationOutline,
  logInOutline
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
  logoUrl: string = 'assets/vlc-logo.svg'; // Cambiado al nuevo logo SVG

  menuItems = [
    { icon: 'bag', label: 'Mis Pedidos', route: '/tabs/orders' },
    { icon: 'heart', label: 'Favoritos', route: '/tabs/favorites' },
    { icon: 'receipt', label: 'Facturas', route: '/tabs/invoices' },
    { icon: 'settings', label: 'Configuración', route: '/tabs/settings' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private supabaseService: SupabaseService
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
      locationOutline,
      logInOutline
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

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  onImageError(event: Event) {
    console.error('Error al cargar la imagen:', (event.target as HTMLImageElement).src);
    
    // Si falla el SVG, usar un Data URI directamente
    const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='90' fill='%2300A884'/%3E%3Cg fill='white'%3E%3Cpath d='M65,80 L80,135 L95,135 L110,80 L95,80 L85,120 L75,80 Z'/%3E%3Cpath d='M120,80 L120,135 L150,135 L150,120 L135,120 L135,80 Z'/%3E%3C/g%3E%3C/svg%3E`;
    
    (event.target as HTMLImageElement).src = fallbackSvg;
  }
} 