import { Routes } from '@angular/router';
import { IntroComponent } from './intro/intro.component';
import { IntroGuard } from './guards/intro.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/stores',
    pathMatch: 'full'
  },
  {
    path: 'intro',
    component: IntroComponent
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes),
    canActivate: [IntroGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: 'order-details/:id',
    loadComponent: () => import('./order-details/order-details.page').then(m => m.OrderDetailsPage)
  },
  {
    path: 'order-help',
    loadComponent: () => import('./help/order-help/order-help.component').then(m => m.OrderHelpComponent)
  },
  {
    path: '**',
    redirectTo: 'tabs/stores'
  }
]; 