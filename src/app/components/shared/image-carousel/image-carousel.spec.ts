import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCarousel } from './image-carousel';

describe('ImageCarousel', () => {
  let component: ImageCarousel;
  let fixture: ComponentFixture<ImageCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCarousel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageCarousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
