import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';

// Definición de rutas
const routes: Routes = [
  {
    path: '',
    component: Tab1Page
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)  // Configuración de rutas integrada
  ],
  declarations: [Tab1Page]
})
export class Tab1PageModule { }