import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { PageLayout } from './page-layout';

describe('PageLayout', () => {
  let component: PageLayout;
  let fixture: ComponentFixture<PageLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageLayout],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons))
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
