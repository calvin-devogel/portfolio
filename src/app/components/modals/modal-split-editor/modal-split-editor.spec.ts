import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSplitEditor } from './modal-split-editor';

describe('ModalSplitEditor', () => {
  let component: ModalSplitEditor;
  let fixture: ComponentFixture<ModalSplitEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSplitEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalSplitEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
