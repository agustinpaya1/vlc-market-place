import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MapStoreModalComponent } from './map-store-modal.component';

describe('MapStoreModalComponent', () => {
  let component: MapStoreModalComponent;
  let fixture: ComponentFixture<MapStoreModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MapStoreModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapStoreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
