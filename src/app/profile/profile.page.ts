import { Component, OnInit, OnDestroy, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { SettingsService } from '../services/settings.service';
import { StoreService } from '../services/store.service';
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
  camera,
  storefront
} from 'ionicons/icons';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular/standalone';

interface ProfileUser extends User {
  name: string;
  isStoreOwner?: boolean;
}

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage implements OnInit, OnDestroy {
  user: ProfileUser = {
    id: '',
    name: 'Usuario',
    email: 'usuario@example.com',
    phone: '',
    address: '',
    photoUrl: undefined,
    isStoreOwner: false
  };

  isAuthenticated = false;
  logoUrl: string = 'https://yftetqhpxurrndkehoeg.supabase.co/storage/v1/object/public/logoapp//logo.png';
  private authSubscription: Subscription | null = null;
  private themeSubscription: Subscription | null = null;
  private resizeListener: () => void;
  private animationFrameId: number | null = null;

  menuItems: MenuItem[] = [
    { id: 'orders', icon: 'bag', label: 'Mis Pedidos', route: '/tabs/orders' },
    { id: 'favorites', icon: 'heart', label: 'Favoritos', route: '/tabs/favorites' },
    { id: 'invoices', icon: 'receipt', label: 'Facturas', route: '/tabs/invoices' },
    { id: 'settings', icon: 'settings', label: 'Configuración', route: '/tabs/settings' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private settingsService: SettingsService,
    private storeService: StoreService,
    private toastController: ToastController,
    private platform: Platform,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef
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
      camera,
      storefront
    });
    console.log('ProfilePage constructor called');
    
    // Optimización: manejar el resize de manera eficiente
    this.resizeListener = () => {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
      
      this.animationFrameId = requestAnimationFrame(() => {
        this.changeDetector.detectChanges();
        this.animationFrameId = null;
      });
    };
  }

  ionViewWillEnter() {
    console.log('ProfilePage - ionViewWillEnter');
    this.checkAuthStatus();
  }

  ngOnInit() {
    console.log('ProfilePage - ngOnInit');
    
    // Optimización: Agregar event listener fuera de la zona de Angular
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.resizeListener, { passive: true });
    });
    
    this.checkAuthStatus();
    
    // Suscribirse a cambios en la configuración de tema
    this.themeSubscription = this.settingsService.getSettings().subscribe(settings => {
      // Forzar detección de cambios cuando cambia el tema
      this.ngZone.run(() => {
        console.log('ProfilePage - Theme settings changed:', settings.darkMode ? 'dark' : 'light');
        this.changeDetector.detectChanges();
      });
    });
  }

  ngOnDestroy() {
    console.log('ProfilePage - ngOnDestroy');
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    
    // Limpiar recursos
    window.removeEventListener('resize', this.resizeListener);
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // Función de seguimiento para optimizar ngFor
  trackById(index: number, item: MenuItem): string {
    return item.id;
  }

  async checkAuthStatus() {
    console.log('ProfilePage - checkAuthStatus');
    
    // Force refresh from Supabase to ensure we have the latest auth state
    try {
      const { data } = await this.supabaseService.getClient().auth.getSession();
      console.log('ProfilePage - Current session:', data.session);
    } catch (error) {
      console.error('Error getting current session:', error);
    }
    
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    
    this.authSubscription = this.authService.user$.subscribe(user => {
      console.log('ProfilePage - Auth subscription update:', user);
      
      // Ejecutar cambios dentro de la zona de Angular y disparar detección de cambios
      this.ngZone.run(() => {
        this.isAuthenticated = !!user;
        
        if (user) {
          console.log('ProfilePage - User is authenticated:', user);
          this.loadUserData(user);
        } else {
          console.log('ProfilePage - User is NOT authenticated');
        }
        
        this.changeDetector.detectChanges();
      });
    });
  }

  async loadUserData(userData: User) {
    console.log('ProfilePage - Loading user data:', userData);
    
    try {
      // Verificar si el usuario es propietario de alguna tienda
      const stores = await this.storeService.getUserStores(userData.id);
      const isStoreOwner = stores.length > 0;
      console.log('ProfilePage - User stores:', stores);
      console.log('ProfilePage - User is store owner:', isStoreOwner);
      
      // Actualizar el usuario con los datos y el estado de propietario
      this.user = {
        ...userData,
        name: userData.name || 'Usuario',
        isStoreOwner
      };

      // Actualizar los elementos del menú basado en si es propietario
      this.menuItems = [
        ...(isStoreOwner ? [{ 
          id: 'store-management', 
          icon: 'storefront', 
          label: 'Administrar Tiendas', 
          route: '/tabs/administracion' 
        }] : []),
        { id: 'orders', icon: 'bag', label: 'Mis Pedidos', route: '/tabs/orders' },
        { id: 'favorites', icon: 'heart', label: 'Favoritos', route: '/tabs/favorites' },
        { id: 'invoices', icon: 'receipt', label: 'Facturas', route: '/tabs/invoices' },
        { id: 'settings', icon: 'settings', label: 'Configuración', route: '/tabs/settings' }
      ];

      console.log('ProfilePage - Updated menu items:', this.menuItems);
      this.changeDetector.detectChanges();
    } catch (error: any) {
      console.error('ProfilePage - Error loading user data:', error);
      const errorToast = await this.toastController.create({
        message: 'Error al cargar los datos: ' + (error.message || 'Error desconocido'),
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await errorToast.present();

      // Si hay un error, asumimos que el usuario no es propietario
      this.user = {
        ...userData,
        name: userData.name || 'Usuario',
        isStoreOwner: false
      };
      
      // Menú por defecto sin opción de administrar tiendas
      this.menuItems = [
        { id: 'orders', icon: 'bag', label: 'Mis Pedidos', route: '/tabs/orders' },
        { id: 'favorites', icon: 'heart', label: 'Favoritos', route: '/tabs/favorites' },
        { id: 'invoices', icon: 'receipt', label: 'Facturas', route: '/tabs/invoices' },
        { id: 'settings', icon: 'settings', label: 'Configuración', route: '/tabs/settings' }
      ];
      
      this.changeDetector.detectChanges();
    }
  }

  editProfile() {
    this.router.navigate(['/tabs/edit-profile']);
  }

  async logout() {
    await this.authService.logout();
    const toast = await this.toastController.create({
      message: 'Has cerrado sesión correctamente',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
    
    this.router.navigate(['/tabs/stores'], { replaceUrl: true });
  }

  async navigate(route: string) {
    console.log('ProfilePage - Intentando navegar a:', route);
    
    // Mostrar notificación de inicio de navegación
    const loadingToast = await this.toastController.create({
      message: `Navegando a ${route}...`,
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await loadingToast.present();

    this.ngZone.run(async () => {
      try {
        // Usar la ruta tal como viene
        console.log('ProfilePage - Ruta completa:', route);
        
        // Intentar la navegación
        const result = await this.router.navigate([route], { 
          replaceUrl: false,
          onSameUrlNavigation: 'reload'
        });
        
        console.log('ProfilePage - Resultado de la navegación:', result);
        
        if (result) {
          const successToast = await this.toastController.create({
            message: 'Navegación exitosa',
            duration: 2000,
            position: 'bottom',
            color: 'success'
          });
          await successToast.present();
        } else {
          throw new Error('La navegación falló');
        }
      } catch (error: any) {
        console.error('ProfilePage - Error en la navegación:', error);
        const errorToast = await this.toastController.create({
          message: 'Error en la navegación: ' + (error.message || 'Error desconocido'),
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await errorToast.present();
      }
    });
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

  async saveProfile() {
    try {
      await this.authService.updateUserProfile({
        phone: this.user.phone,
        address: this.user.address
      });
      const toast = await this.toastController.create({
        message: 'Datos actualizados correctamente',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al actualizar los datos',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  async saveProfileField(field: 'phone' | 'address') {
    try {
      const update: any = {};
      update[field] = this.user[field];
      await this.authService.updateUserProfile(update);
      const toast = await this.toastController.create({
        message: (field === 'phone' ? 'Teléfono' : 'Dirección') + ' actualizado correctamente',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al actualizar ' + (field === 'phone' ? 'el teléfono' : 'la dirección'),
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  createStore() {
    console.log('ProfilePage - Creating store');
    this.router.navigate(['/tabs/store-create']).then(() => {
      console.log('ProfilePage - Navigation to store creation completed');
    }).catch(error => {
      console.error('ProfilePage - Navigation error:', error);
    });
  }
} 