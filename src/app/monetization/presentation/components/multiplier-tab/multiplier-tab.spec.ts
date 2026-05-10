import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipliersTabComponent } from './multiplier-tab';

describe('MultipliersTabComponent', () => {
  let component: MultipliersTabComponent;
  let fixture: ComponentFixture<MultipliersTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipliersTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultipliersTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
