import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreContentComponent } from './store-content';

describe('StoreContent', () => {
  let component: StoreContentComponent;
  let fixture: ComponentFixture<StoreContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreContentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
