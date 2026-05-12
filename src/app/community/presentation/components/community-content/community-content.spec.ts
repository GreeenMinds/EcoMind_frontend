import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityContent } from './community-content';

describe('CommunityContent', () => {
  let component: CommunityContent;
  let fixture: ComponentFixture<CommunityContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityContent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
