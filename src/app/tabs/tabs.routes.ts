import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tab3',
        loadComponent: () =>
          import('../main-page/main-page.component').then((m) => m.MainPageComponent),
      },
      {
        path: 'tab4',
        loadComponent: () =>
          import('../tab4/tab4.page').then((m) => m.Tab4Page),
      },
      {
        path: 'tab5',
        loadComponent: () =>
          import('../tab5/tab5.page').then((m) => m.Tab5Page),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('../carrito/carrito.component').then((m) => m.CarritoComponent),
      },
      {
        path: '',
        redirectTo: '/tabs/tab3',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../tab1/tab1.page').then((m) => m.Tab1Page),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../tab2/tab2.page').then((m) => m.Tab2Page),
  },
  {
    path: '',
    redirectTo: '/tabs/tab3',
    pathMatch: 'full',
  },
];
