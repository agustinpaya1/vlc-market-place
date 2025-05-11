import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
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
  logInOutline,
  camera
} from 'ionicons/icons';
import { ToastController } from '@ionic/angular';

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
    address: 'Calle Valencia, 123, Valencia',
    photoUrl: null as string | null
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
    private supabaseService: SupabaseService,
    private toastController: ToastController
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
      logInOutline,
      camera
    });
  }

  ionViewWillEnter() {
    // Verificar la autenticación cada vez que se entra en la página
    this.checkAuthStatus();
  }

  ngOnInit() {
    console.log('ProfilePage - ngOnInit');
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    // Comprobar si el usuario está autenticado
    this.authService.user$.subscribe(user => {
      console.log('ProfilePage - Usuario recibido:', user);
      this.isAuthenticated = !!user;
      if (user) {
        this.loadUserData(user);
      }
    });
  }

  loadUserData(userData: User) {
    console.log('ProfilePage - Cargando datos de usuario:', userData);
    
    // Actualizar el nombre con la mejor información disponible
    if (userData.fullName) {
      this.user.name = userData.fullName;
    } else if (userData.email) {
      // Usar el email como nombre si no hay fullName
      this.user.name = userData.email.split('@')[0];
    }
    
    // Actualizar el correo electrónico
    if (userData.email) {
      this.user.email = userData.email;
    }

    // Actualizar la URL de la foto de perfil si está disponible
    if (userData.photoUrl) {
      this.user.photoUrl = userData.photoUrl;
    }
  }

  editProfile() {
    // Navegar a la página de edición de perfil
    this.router.navigate(['/tabs/edit-profile']);
  }

  async logout() {
    await this.authService.logout();
    // Show a toast message
    const toast = await this.toastController.create({
      message: 'Has cerrado sesión correctamente',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
    
    this.router.navigate(['/']);
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

  async onPhotoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.error('No files selected');
      return;
    }

    const file = input.files[0];
    console.log('Selected file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      // Obtener el ID del usuario actual
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        console.error('No authenticated user');
        throw new Error('No hay usuario autenticado');
      }

      console.log('Current user:', currentUser);

      // Validar tamaño y tipo de archivo antes de la subida
      if (file.size > 5 * 1024 * 1024) { // 5MB
        const toastLarge = await this.toastController.create({
          message: 'El archivo es demasiado grande. Máximo 5MB.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toastLarge.present();
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        const toastType = await this.toastController.create({
          message: 'Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y GIF.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toastType.present();
        return;
      }

      // Subir la foto de perfil
      const photoUrl = await this.supabaseService.uploadProfilePhoto(file, currentUser.id);
      
      console.log('Photo uploaded successfully:', photoUrl);
      console.log('Full photo details:', {
        url: photoUrl,
        userId: currentUser.id,
        fileName: file.name
      });

      // Actualizar la URL de la foto en el estado local
      this.user.photoUrl = photoUrl;

      // Forzar actualización de la vista
      this.authService.updateUserPhotoUrl(currentUser.id, photoUrl);

      // Mostrar un toast de éxito
      const toast = await this.toastController.create({
        message: 'Foto de perfil actualizada',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

    } catch (error) {
      console.error('Comprehensive error in onPhotoUpload:', error);
      
      // Mostrar un toast de error con más detalles
      const toast = await this.toastController.create({
        message: `Error al actualizar la foto de perfil: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Add onImageError method to handle image loading failures
  onImageError(event: any) {
    // Determine the source of the error
    const imgElement = event.target;
    const originalSrc = imgElement.src;

    console.error('Image Load Error:', {
      originalSrc: originalSrc,
      alt: imgElement.alt,
      fullEvent: event
    });

    // Fallback to default profile image
    imgElement.src = 'assets/default-profile.svg';
    
    // Optional: Log the error to help diagnose issues
    this.logImageLoadError(originalSrc);
  }

  // Optional method to log image load errors
  private async logImageLoadError(imageUrl: string) {
    try {
      const currentUser = await this.authService.getCurrentUser();
      console.error('Detailed Image Load Error:', {
        userId: currentUser?.id,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      // Optional: Send error to a logging service
      // this.loggingService.logError('Image Load Failure', { imageUrl, userId: currentUser?.id });
    } catch (error) {
      console.error('Error logging image load failure:', error);
    }

    // Attempt to validate image URL
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      console.log('Image URL Validation:', {
        url: imageUrl,
        status: response.status,
        ok: response.ok
      });
    } catch (fetchError) {
      console.error('URL Fetch Error:', fetchError);
    }
  }
} 