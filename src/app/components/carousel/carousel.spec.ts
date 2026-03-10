import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Carousel } from './carousel';

describe('Carousel', () => {
  let component: Carousel;
  let fixture: ComponentFixture<Carousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carousel],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons))
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Carousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
