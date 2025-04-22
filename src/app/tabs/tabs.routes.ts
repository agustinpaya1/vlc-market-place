import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'map',
        loadComponent: () =>
          import('../map/map.page').then((m) => m.MapPage),
      },
      {
        path: 'stores',
        loadComponent: () =>
          import('../stores/stores.page').then((m) => m.StoresPage),
      },
      {
        path: 'store/:id',
        loadComponent: () =>
          import('../store/store.page').then((m) => m.StorePage),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('../carrito/carrito.component').then((m) => m.CarritoComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('../locations/locations.page').then((m) => m.LocationsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/stores',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    redirectTo: '/tabs/stores',
    pathMatch: 'full',
  },
];
