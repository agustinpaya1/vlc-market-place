import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: 'stores',
        pathMatch: 'full',
      },
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
        path: 'edit-profile',
        loadComponent: () =>
          import('../profile/edit-profile/edit-profile.component').then((m) => m.EditProfileComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('../orders/orders.page').then((m) => m.OrdersPage),
      },
      {
        path: 'order-tracking/:id',
        loadComponent: () =>
          import('../order-tracking/order-tracking.component').then((m) => m.OrderTrackingComponent),
      },
      {
        path: 'favorites',
        loadComponent: () =>
          import('../favorites/favorites.page').then((m) => m.FavoritesPage),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('../invoices/invoices.page').then((m) => m.InvoicesPage),
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
        path: 'administracion',
        loadComponent: () =>
          import('../store-management/store-management.page').then((m) => m.StoreManagementPage),
      },
      {
        path: 'store-edit/:id',
        loadComponent: () =>
          import('../store-management/store-edit/store-edit.page').then((m) => m.StoreEditPage),
      },
      {
        path: 'store-create',
        loadComponent: () =>
          import('../store-management/store-create/store-create.page').then((m) => m.StoreCreatePage),
      },
      {
        path: 'store-products/:id',
        loadComponent: () =>
          import('../store-management/store-products/store-products.page').then((m) => m.StoreProductsPage),
      },
      {
        path: 'store-orders/:id',
        loadComponent: () =>
          import('../store-management/store-orders/store-orders.page').then((m) => m.StoreOrdersPage),
      },
      {
        path: 'order-validation/:storeId',
        loadComponent: () =>
          import('../pages/order-validation/order-validation.page').then((m) => m.OrderValidationPage),
      }
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
  }
];
