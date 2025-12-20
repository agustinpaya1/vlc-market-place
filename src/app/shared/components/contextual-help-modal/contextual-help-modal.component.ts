import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, ViewEncapsulation } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bulbOutline, arrowForwardOutline } from 'ionicons/icons';
import { HelpSlide } from '../../../interfaces/contextual-help.interfaces';
// import function to register Swiper custom elements
import { register } from 'swiper/element/bundle';

// register Swiper custom elements
register();

@Component({
    selector: 'app-contextual-help-modal',
    templateUrl: './contextual-help-modal.component.html',
    styleUrls: ['./contextual-help-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, IonContent, IonButton, IonIcon],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    encapsulation: ViewEncapsulation.None
})
export class ContextualHelpModalComponent {
    @Input() slides: HelpSlide[] = [];

    constructor(private modalCtrl: ModalController) {
        addIcons({ bulbOutline, arrowForwardOutline });
    }

    close() {
        this.modalCtrl.dismiss();
    }
}
