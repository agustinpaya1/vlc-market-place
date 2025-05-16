import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-help',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/orders"></ion-back-button>
        </ion-buttons>
        <ion-title>Ayuda con Pedidos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Sección de búsqueda -->
      <div class="search-container">
        <ion-searchbar 
          placeholder="Buscar en ayuda..." 
          animated 
          color="light"
          (ionInput)="filterHelp($event)">
        </ion-searchbar>
      </div>

      <!-- Acciones rápidas -->
      <div class="quick-actions">
        <ion-button expand="block" fill="clear" (click)="scrollToSection('status')">
          <ion-icon name="information-circle" slot="start"></ion-icon>
          Estados de pedido
        </ion-button>
        <ion-button expand="block" fill="clear" (click)="scrollToSection('faq')">
          <ion-icon name="help-circle" slot="start"></ion-icon>
          Preguntas frecuentes
        </ion-button>
        <ion-button expand="block" fill="clear" (click)="scrollToSection('contact')">
          <ion-icon name="call" slot="start"></ion-icon>
          Contactar soporte
        </ion-button>
      </div>

      <!-- Sección de estados de pedido -->
      <ion-card id="status" class="help-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="speedometer-outline" class="section-icon"></ion-icon>
            Estados de Pedido
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p class="section-description">Conoce los diferentes estados por los que pasa tu pedido:</p>
          
          <div class="status-list">
            <div class="status-item pending">
              <ion-icon name="time-outline"></ion-icon>
              <div class="status-info">
                <h3>Pendiente</h3>
                <p>Tu pedido ha sido recibido pero aún no ha sido procesado por la tienda.</p>
              </div>
            </div>
            
            <div class="status-item processing">
              <ion-icon name="construct-outline"></ion-icon>
              <div class="status-info">
                <h3>En preparación</h3>
                <p>La tienda está preparando los productos de tu pedido.</p>
              </div>
            </div>
            
            <div class="status-item shipped">
              <ion-icon name="car-outline"></ion-icon>
              <div class="status-info">
                <h3>Enviado</h3>
                <p>Tu pedido está en camino a la dirección de entrega.</p>
              </div>
            </div>
            
            <div class="status-item delivered">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <div class="status-info">
                <h3>Entregado</h3>
                <p>El pedido ha sido entregado correctamente en la dirección indicada.</p>
              </div>
            </div>
            
            <div class="status-item completed">
              <ion-icon name="checkbox-outline"></ion-icon>
              <div class="status-info">
                <h3>Completado</h3>
                <p>El pedido ha sido completado y confirmado por ambas partes.</p>
              </div>
            </div>
            
            <div class="status-item canceled">
              <ion-icon name="close-circle-outline"></ion-icon>
              <div class="status-info">
                <h3>Cancelado</h3>
                <p>El pedido ha sido cancelado y no será procesado.</p>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Preguntas frecuentes -->
      <ion-card id="faq" class="help-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="help-circle-outline" class="section-icon"></ion-icon>
            Preguntas Frecuentes
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p class="section-description">Respuestas a las dudas más comunes:</p>
          
          <ion-accordion-group>
            <ion-accordion value="first">
              <ion-item slot="header" lines="none" class="faq-item">
                <ion-icon name="help" slot="start" color="primary"></ion-icon>
                <ion-label>¿Por qué no veo mis pedidos?</ion-label>
              </ion-item>
              <div slot="content" class="faq-content">
                <p>Si no ves tus pedidos, puede deberse a alguna de estas razones:</p>
                <ul>
                  <li>Tu sesión ha caducado. Prueba a cerrar sesión y volver a iniciar.</li>
                  <li>Tienes problemas de conexión. Comprueba tu conexión a internet.</li>
                  <li>Aún no has realizado ninguna compra.</li>
                  <li>El proceso de compra no se completó correctamente.</li>
                </ul>
                <ion-button fill="clear" size="small" expand="block" (click)="showLoginHelp()">
                  <ion-icon name="log-in" slot="start"></ion-icon>
                  Ayuda con el inicio de sesión
                </ion-button>
              </div>
            </ion-accordion>
            
            <ion-accordion value="second">
              <ion-item slot="header" lines="none" class="faq-item">
                <ion-icon name="close-circle" slot="start" color="primary"></ion-icon>
                <ion-label>¿Cómo puedo cancelar un pedido?</ion-label>
              </ion-item>
              <div slot="content" class="faq-content">
                <p>Solo puedes cancelar pedidos que estén en estado "Pendiente". Para cancelar un pedido:</p>
                <ol>
                  <li>Ve a la página de detalles del pedido</li>
                  <li>Pulsa el botón "Cancelar pedido"</li>
                  <li>Confirma la cancelación</li>
                </ol>
                <p>Si el pedido ya está en preparación o ha sido enviado, deberás contactar con atención al cliente.</p>
                <ion-button fill="clear" size="small" expand="block" (click)="showCancelHelp()">
                  <ion-icon name="trash" slot="start"></ion-icon>
                  Ver política de cancelaciones
                </ion-button>
              </div>
            </ion-accordion>
            
            <ion-accordion value="third">
              <ion-item slot="header" lines="none" class="faq-item">
                <ion-icon name="timer" slot="start" color="primary"></ion-icon>
                <ion-label>¿Cuánto tarda en llegar mi pedido?</ion-label>
              </ion-item>
              <div slot="content" class="faq-content">
                <p>El tiempo de entrega depende de varios factores:</p>
                <ul>
                  <li>La disponibilidad de los productos</li>
                  <li>La ubicación de la tienda y tu dirección</li>
                  <li>El método de envío elegido</li>
                </ul>
                <p>En general, los pedidos suelen entregarse en 24-48 horas hábiles desde la confirmación.</p>
                <ion-button fill="clear" size="small" expand="block" (click)="showShippingHelp()">
                  <ion-icon name="map" slot="start"></ion-icon>
                  Ver zonas de envío
                </ion-button>
              </div>
            </ion-accordion>
            
            <ion-accordion value="fourth">
              <ion-item slot="header" lines="none" class="faq-item">
                <ion-icon name="create" slot="start" color="primary"></ion-icon>
                <ion-label>¿Puedo modificar mi pedido?</ion-label>
              </ion-item>
              <div slot="content" class="faq-content">
                <p>Solo puedes modificar pedidos en estado "Pendiente". Para ello, contacta con atención al cliente lo antes posible indicando el número de pedido y los cambios que deseas realizar.</p>
                <ion-button fill="clear" size="small" expand="block" (click)="contactSupport()">
                  <ion-icon name="chatbubbles" slot="start"></ion-icon>
                  Contactar con soporte
                </ion-button>
              </div>
            </ion-accordion>

            <ion-accordion value="fifth">
              <ion-item slot="header" lines="none" class="faq-item">
                <ion-icon name="arrow-undo" slot="start" color="primary"></ion-icon>
                <ion-label>¿Cómo hago una devolución?</ion-label>
              </ion-item>
              <div slot="content" class="faq-content">
                <p>Para hacer una devolución:</p>
                <ol>
                  <li>Dirígete a la sección "Mis Pedidos"</li>
                  <li>Selecciona el pedido que quieres devolver</li>
                  <li>Pulsa en "Solicitar devolución" y sigue los pasos</li>
                </ol>
                <p>Tienes 14 días naturales desde la recepción para solicitar una devolución.</p>
                <ion-button fill="clear" size="small" expand="block" (click)="showReturnPolicy()">
                  <ion-icon name="document" slot="start"></ion-icon>
                  Ver política de devoluciones
                </ion-button>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </ion-card-content>
      </ion-card>

      <!-- Contacto -->
      <ion-card id="contact" class="help-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="call-outline" class="section-icon"></ion-icon>
            Contacto
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p class="section-description">Si necesitas más ayuda, contacta con nuestro equipo de soporte:</p>
          
          <div class="contact-info">
            <ion-item lines="none" class="contact-item">
              <ion-icon name="mail" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Email</h3>
                <p>ayuda@mercau.com</p>
              </ion-label>
              <ion-button fill="clear" slot="end" (click)="copyToClipboard('ayuda@mercau.com')">
                <ion-icon name="copy-outline"></ion-icon>
              </ion-button>
            </ion-item>
            
            <ion-item lines="none" class="contact-item">
              <ion-icon name="call" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Teléfono</h3>
                <p>900 123 456</p>
                <p class="schedule">Lun-Vie: 9:00-18:00</p>
              </ion-label>
              <ion-button fill="clear" slot="end" (click)="callNumber('900123456')">
                <ion-icon name="call-outline"></ion-icon>
              </ion-button>
            </ion-item>
            
            <ion-item lines="none" class="contact-item">
              <ion-icon name="chatbubbles" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Chat en vivo</h3>
                <p>Disponible en nuestra web</p>
                <p class="schedule">Todos los días: 9:00-22:00</p>
              </ion-label>
            </ion-item>
          </div>
          
          <ion-button expand="block" class="contact-button" (click)="contactSupport()">
            <ion-icon name="headset" slot="start"></ion-icon>
            Contactar ahora
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Asistente virtual -->
      <ion-card class="help-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="chatbubble-ellipses-outline" class="section-icon"></ion-icon>
            Asistente Virtual
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p class="section-description">¿No encuentras lo que buscas? Nuestro asistente virtual puede ayudarte:</p>
          
          <ion-item lines="none" class="assistant-item">
            <ion-avatar slot="start">
              <img src="assets/assistant-avatar.png" alt="Asistente" onError="this.src='assets/default-avatar.png'">
            </ion-avatar>
            <ion-label>
              <h3>Asesor virtual</h3>
              <p>Respuesta inmediata a tus dudas</p>
            </ion-label>
          </ion-item>
          
          <ion-button expand="block" class="assistant-button" (click)="startVirtualAssistant()">
            <ion-icon name="chatbubbles" slot="start"></ion-icon>
            Iniciar chat con asistente
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    ion-toolbar {
      --background: var(--ion-color-primary);
      --color: white;
    }

    .search-container {
      background-color: var(--ion-color-primary);
      padding: 0 16px 16px;
      border-bottom-left-radius: 24px;
      border-bottom-right-radius: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    ion-searchbar {
      --border-radius: 12px;
      --background: rgba(255, 255, 255, 0.95);
      --icon-color: var(--ion-color-primary);
      --placeholder-color: var(--ion-color-medium);
      --color: var(--ion-color-dark);
      padding: 0;
    }

    .quick-actions {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 16px 8px;
      margin-bottom: 8px;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .quick-actions::-webkit-scrollbar {
      display: none;
    }

    .quick-actions ion-button {
      flex: 0 0 auto;
      margin: 0 4px;
      --border-radius: 12px;
      font-size: 14px;
      --padding-start: 12px;
      --padding-end: 12px;
      --background: rgba(var(--ion-color-primary-rgb), 0.1);
      --color: var(--ion-color-primary);
      white-space: nowrap;
    }

    .help-card {
      margin: 16px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    ion-card-header {
      padding-bottom: 8px;
    }

    ion-card-title {
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
    }

    .section-icon {
      font-size: 24px;
      margin-right: 8px;
      color: var(--ion-color-primary);
    }

    .section-description {
      color: var(--ion-color-medium);
      margin-bottom: 16px;
      font-size: 15px;
    }

    .status-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-item {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      border-radius: 12px;
      background-color: rgba(var(--ion-color-light-rgb), 0.7);
    }

    .status-item ion-icon {
      font-size: 24px;
      margin-right: 12px;
      margin-top: 2px;
    }

    .status-info h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .status-info p {
      margin: 0;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .pending ion-icon {
      color: var(--ion-color-warning);
    }

    .processing ion-icon {
      color: var(--ion-color-primary);
    }

    .shipped ion-icon {
      color: var(--ion-color-tertiary);
    }

    .delivered ion-icon, .completed ion-icon {
      color: var(--ion-color-success);
    }

    .canceled ion-icon {
      color: var(--ion-color-danger);
    }

    ion-accordion-group {
      background: transparent;
    }

    ion-accordion {
      margin-bottom: 8px;
      --background: rgba(var(--ion-color-light-rgb), 0.7);
      border-radius: 12px;
      overflow: hidden;
    }

    .faq-item {
      --background: transparent;
      --border-color: transparent;
    }

    .faq-content {
      padding: 16px;
      background-color: rgba(var(--ion-color-light-rgb), 0.3);
    }

    .faq-content ul, .faq-content ol {
      padding-left: 16px;
      margin-bottom: 16px;
    }

    .faq-content li {
      margin-bottom: 8px;
      color: var(--ion-color-medium);
    }

    .contact-info {
      margin-bottom: 16px;
    }

    .contact-item {
      --background: rgba(var(--ion-color-light-rgb), 0.7);
      margin-bottom: 12px;
      border-radius: 12px;
    }

    .schedule {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }

    .contact-button {
      margin-top: 16px;
      --border-radius: 12px;
      --background: var(--ion-color-primary);
      font-weight: 500;
    }

    .assistant-item {
      --background: rgba(var(--ion-color-light-rgb), 0.7);
      margin-bottom: 16px;
      border-radius: 12px;
    }

    .assistant-button {
      --border-radius: 12px;
      --background: var(--ion-color-tertiary);
      font-weight: 500;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class OrderHelpComponent {
  constructor(private toastCtrl: ToastController) {}

  scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  filterHelp(event: any) {
    const query = event.target.value.toLowerCase();
    console.log('Buscando ayuda: ' + query);
    // Implementar búsqueda en un futuro
  }

  async showLoginHelp() {
    const toast = await this.toastCtrl.create({
      message: 'Ayuda de inicio de sesión no disponible actualmente',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
  }

  async showCancelHelp() {
    const toast = await this.toastCtrl.create({
      message: 'Política de cancelaciones aún no disponible',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
  }

  async showShippingHelp() {
    const toast = await this.toastCtrl.create({
      message: 'Información de zonas de envío no disponible actualmente',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
  }

  async showReturnPolicy() {
    const toast = await this.toastCtrl.create({
      message: 'Política de devoluciones aún no disponible',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
  }

  async contactSupport() {
    const toast = await this.toastCtrl.create({
      message: 'Contactando con soporte...',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  async startVirtualAssistant() {
    const toast = await this.toastCtrl.create({
      message: 'Asistente virtual no disponible actualmente',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      const toast = await this.toastCtrl.create({
        message: 'Copiado al portapapeles',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (err) {
      console.error('Error al copiar: ', err);
      const toast = await this.toastCtrl.create({
        message: 'No se pudo copiar al portapapeles',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  callNumber(number: string) {
    window.location.href = `tel:${number}`;
  }
} 