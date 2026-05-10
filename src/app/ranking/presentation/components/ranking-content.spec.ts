import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankingContent } from './ranking-content';

describe('RankingContent', () => {
  let component: RankingContent;
  let fixture: ComponentFixture<RankingContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingContent],
    }).compileComponents();

    fixture = TestBed.createComponent(RankingContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
