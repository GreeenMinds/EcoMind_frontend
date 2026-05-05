import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreContent } from './store-content';

describe('StoreContent', () => {
  let component: StoreContent;
  let fixture: ComponentFixture<StoreContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreContent],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
