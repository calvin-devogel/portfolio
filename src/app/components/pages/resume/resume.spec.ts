import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Resume } from './resume';

describe('Resume', () => {
  let component: Resume;
  let fixture: ComponentFixture<Resume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resume]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Resume);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
