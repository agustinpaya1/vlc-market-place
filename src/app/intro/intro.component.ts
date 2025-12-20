import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { rocketOutline, trophyOutline, codeSlashOutline, openOutline, star, medal, arrowForwardOutline } from 'ionicons/icons';
import { register } from 'swiper/element/bundle';

// Register Swiper custom elements
register();

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class IntroComponent implements AfterViewInit {
  @ViewChild('swiper') swiperRef: ElementRef | undefined;

  constructor(private router: Router) {
    addIcons({
      rocketOutline,
      trophyOutline,
      codeSlashOutline,
      openOutline,
      star,
      medal,
      arrowForwardOutline
    });
  }

  ngAfterViewInit() {
    // Swiper is ready
  }

  finish() {
    localStorage.setItem('introSeen', 'true');
    this.router.navigate(['/tabs/stores'], { replaceUrl: true });
  }
}
