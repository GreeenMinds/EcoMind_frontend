import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GemsTabComponent } from './gem-tab';

describe('GemsTabComponent', () => {
  let component: GemsTabComponent;
  let fixture: ComponentFixture<GemsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GemsTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GemsTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
