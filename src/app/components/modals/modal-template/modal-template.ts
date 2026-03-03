import {
  Component,
  inject,
  input,
  output,
  ApplicationRef,
  EmbeddedViewRef,
  TemplateRef,
  ViewChild,
  signal,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-modal-template',
  imports: [
    CommonModule,
    FeatherModule,
  ],
  templateUrl: './modal-template.html',
  styleUrls: ['./modal-template.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ModalTemplate implements OnDestroy {
  private appRef = inject(ApplicationRef);
  private document = inject(DOCUMENT);

  title = input<string>('Modal');
  closeOnBackdrop = input<boolean>(true);
  modalMaxWidth = input<string>('600px');
  modalHeight = input<string>('auto');

  titleIconTemplate = input<TemplateRef<void> | null>(null);
  titleBadgeTemplate = input<TemplateRef<void> | null>(null);
  actionsTemplate = input<TemplateRef<void> | null>(null);
  bodyTemplate = input<TemplateRef<void> | null>(null);

  opened = output<void>();
  closed = output<void>();

  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<void>;
  private modalViewRef: EmbeddedViewRef<void> | null = null;
  private readonly ANIMATION_DURATION = 200; // Duration of the open/close animation in ms

  isModalOpen = signal(false);

  openModal(): void {
    if (this.modalViewRef) return;

    this.isModalOpen.set(true);
    this.document.body.style.overflow = 'hidden';

    this.modalViewRef = this.modalTemplate.createEmbeddedView(void 0);
    this.appRef.attachView(this.modalViewRef);
    this.modalViewRef.rootNodes.forEach(node =>
      this.document.body.appendChild(node)
    );

    this.opened.emit();
  }

  closeModal() {
    if (!this.modalViewRef) return;
    
    const overlay = this.modalViewRef.rootNodes[0] as HTMLElement;
    const modal = overlay?.querySelector('.modal') as HTMLElement | null;
    overlay?.classList.add('is-closing');
    modal?.classList.add('is-closing');

    setTimeout(() => {
      this.document.body.style.overflow = '';
      if (this.modalViewRef) {
        this.appRef.detachView(this.modalViewRef);
        this.modalViewRef.rootNodes.forEach(node => node.remove?.());
        this.modalViewRef.destroy();
        this.modalViewRef = null;
      }
      this.isModalOpen.set(false);
      this.closed.emit();
    }, this.ANIMATION_DURATION);
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) this.closeModal();
  }

  ngOnDestroy(): void {
    this.closeModal();
  }
}
