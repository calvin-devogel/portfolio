import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { ModalTemplate } from './modal-template';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('ModalTemplate', () => {
  let component: ModalTemplate;
  let fixture: ComponentFixture<ModalTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalTemplate],
      providers: [importProvidersFrom(FeatherModule.pick(allIcons))],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle body overflow when opening and closing the modal', async () => {
    const initialOverflow = document.body.style.overflow;
    component.openModal();
    fixture.detectChanges();
    expect(document.body.style.overflow).not.toBe(initialOverflow);

    await new Promise<void>((resolve) => {
      component.closed.subscribe(resolve);
      component.closeModal();
    });

    expect(document.body.style.overflow).toBe(initialOverflow);
  });

  it('should allow configuring closeOnBackdrop', async () => {
    expect(component.closeOnBackdrop().valueOf()).toBeDefined();
    const originalValue = component.closeOnBackdrop().valueOf();
    fixture.componentRef.setInput('closeOnBackdrop', !originalValue);
    fixture.detectChanges();
    expect(component.closeOnBackdrop().valueOf()).toBe(!originalValue);

    const initialOverflow = document.body.style.overflow;
    component.openModal();
    fixture.detectChanges();

    if (originalValue) {
      // was true, now false, should not close the modal on backdrop click
      component.onBackdropClick();
      fixture.detectChanges();
      expect(document.body.style.overflow).not.toBe(initialOverflow);
      await new Promise<void>((resolve) => {
        component.closed.subscribe(resolve);
        component.closeModal();
      });
    } else {
      // was false, now true, should close the modal on backdrop click
      await new Promise<void>((resolve) => {
        component.closed.subscribe(resolve);
        component.onBackdropClick();
      });
      expect(document.body.style.overflow).toBe(initialOverflow);
    }
  });
});
