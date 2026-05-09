import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CosmeticsTabComponent } from './cosmetics-tab';

describe('CosmeticsTabComponent', () => {
  let component: CosmeticsTabComponent;
  let fixture: ComponentFixture<CosmeticsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CosmeticsTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CosmeticsTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
