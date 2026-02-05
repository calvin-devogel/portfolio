import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationToast } from './notification-toast';

describe('NotificationToast', () => {
  let component: NotificationToast;
  let fixture: ComponentFixture<NotificationToast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationToast]
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
