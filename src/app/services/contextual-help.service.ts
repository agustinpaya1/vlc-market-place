import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { ContextualHelpModalComponent } from '../shared/components/contextual-help-modal/contextual-help-modal.component';
import { HelpSlide, FeatureId } from '../interfaces/contextual-help.interfaces';

@Injectable({
    providedIn: 'root'
})
export class ContextualHelpService {

    private tutorialContent: Record<FeatureId, HelpSlide[]> = {
        'map': [
            {
                title: 'Explora tu zona',
                text: 'Navega por el mapa para encontrar comercios cercanos.'
            },
            {
                title: 'Estado en Tiempo Real',
                text: '🟢 <b>Chinchetas Verdes:</b> Tiendas abiertas ahora.\n⚪ <b>Chinchetas Grises:</b> Tiendas cerradas.'
            }
        ],
        'stores': [
            {
                title: 'Directorio de Comercios',
                text: 'Filtra por categorías (Fruterías, Carnicerías...) o busca tu tienda favorita.'
            }
        ],
        'cart': [] // Future expansion
    };

    constructor(private modalController: ModalController) { }

    async checkAndShow(featureId: FeatureId) {
        const hasSeen = localStorage.getItem(`hasSeenTutorial_${featureId}`);

        if (!hasSeen) {
            await this.showTutorial(featureId);
            this.markAsSeen(featureId);
        }
    }

    private async showTutorial(featureId: FeatureId) {
        const slides = this.tutorialContent[featureId];
        if (!slides || slides.length === 0) return;

        const modal = await this.modalController.create({
            component: ContextualHelpModalComponent,
            componentProps: {
                slides: slides
            },
            cssClass: 'contextual-help-modal',
            backdropDismiss: false
        });

        await modal.present();
    }

    private markAsSeen(featureId: FeatureId) {
        localStorage.setItem(`hasSeenTutorial_${featureId}`, 'true');
    }

    // Debug/Dev helper
    resetTutorial(featureId: FeatureId) {
        localStorage.removeItem(`hasSeenTutorial_${featureId}`);
    }
}
