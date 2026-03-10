import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { X } from 'angular-feather/icons';
import { NotificationToast } from './notification-toast';

describe('NotificationToast', () => {
  let component: NotificationToast;
  let fixture: ComponentFixture<NotificationToast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationToast],
      providers: [importProvidersFrom(FeatherModule.pick({ X }))]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationToast);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
