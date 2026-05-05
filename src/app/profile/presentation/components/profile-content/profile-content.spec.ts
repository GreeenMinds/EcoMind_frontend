import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileContent } from './profile-content';

describe('ProfileContent', () => {
  let component: ProfileContent;
  let fixture: ComponentFixture<ProfileContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileContent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
