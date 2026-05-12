import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayModalComponent } from './pay-modals';

describe('PayModalComponent', () => {
  let component: PayModalComponent;
  let fixture: ComponentFixture<PayModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PayModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
