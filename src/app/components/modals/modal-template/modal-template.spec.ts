import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTemplate } from './modal-template';

describe('ModalTemplate', () => {
  let component: ModalTemplate;
  let fixture: ComponentFixture<ModalTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalTemplate);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle body overflow when opening and closing the modal', () => {
    const initialOverflow = document.body.style.overflow;
    component.openModal();
    fixture.detectChanges();
    expect(document.body.style.overflow).not.toBe(initialOverflow);
    component.closeModal();
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe(initialOverflow);
  })

  it('should allow configuring closeOnBackdrop', () => {
    expect(component.closeOnBackdrop().valueOf()).toBeDefined();
    const originalValue = component.closeOnBackdrop().valueOf();
    fixture.componentRef.setInput('closeOnBackdrop', !originalValue);
    fixture.detectChanges();
    expect(component.closeOnBackdrop().valueOf()).toBe(!originalValue);

    const initialOverflow = document.body.style.overflow;
    component.openModal();
    fixture.detectChanges();
    component.onBackdropClick();
    fixture.detectChanges();
    if (originalValue) {
      expect(document.body.style.overflow).toBe(initialOverflow);
    } else {
      expect(document.body.style.overflow).not.toBe(initialOverflow);
    }
  })
});
