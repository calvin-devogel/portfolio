import { Component, ViewChild } from '@angular/core';
import { Contact } from '@components/modals/contact/contact';

@Component({
  selector: 'app-footer',
  imports: [Contact],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  @ViewChild('contactModal') contactModal!: Contact;

  openContactModal(): void {
    this.contactModal.openModal();
  }
}
