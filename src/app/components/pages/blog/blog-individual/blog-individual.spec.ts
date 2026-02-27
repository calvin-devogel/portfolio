import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogIndividual } from './blog-individual';

describe('BlogIndividual', () => {
  let component: BlogIndividual;
  let fixture: ComponentFixture<BlogIndividual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogIndividual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogIndividual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
