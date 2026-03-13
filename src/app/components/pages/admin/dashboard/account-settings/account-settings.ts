import {
  Component,
  inject,
  signal,
  OnInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { TotpService } from '@services/auth/totp-service';
import { NotificationService } from '@services/notifications/notification-service';
import QRCode from 'qrcode';

type PageState = 'loading' | 'disabled' | 'setup-pending' | 'enabled';

@Component({
  selector: 'app-account-settings',
  imports: [CommonModule, FormsModule, FeatherModule],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.scss',
})
export class AccountSettings implements OnInit {
  private totpService = inject(TotpService);
  private notificationService = inject(NotificationService);
  @ViewChildren('confirmDigitInput') private confirmDigitInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  state = signal<PageState>('loading');
  busy = signal(false);
  qrDataUrl = signal<string | null>(null);
  confirmDigits: string[] = Array(6).fill('');
  get confirmCode(): string {
    return this.confirmDigits.join('');
  }
  disablePassword = '';
  disableStep = signal<'idle' | 'confirm'>('idle');

  ngOnInit() {
    this.totpService.getStatus().subscribe((status) => {
      if (status === null) {
        this.notificationService.error('Failed to load account settings.');
        this.state.set('disabled');
        return;
      }
      this.state.set(status.totp_enabled ? 'enabled' : 'disabled');
    });
  }

  startSetup() {
    this.busy.set(true);
    this.totpService.setup().subscribe(async (uri) => {
      this.busy.set(false);
      if (!uri) {
        this.notificationService.error('Failed to initiate 2FA setup.');
        return;
      }
      try {
        this.qrDataUrl.set(await QRCode.toDataURL(uri, { width: 220, margin: 2 }));
        this.state.set('setup-pending');
      } catch {
        this.notificationService.error('Failed to generate QR code.');
      }
    });
  }

  cancelSetup() {
    this.state.set('disabled');
    this.qrDataUrl.set(null);
    this.confirmDigits = Array(6).fill('');
    this.disablePassword = '';
  }

  startDisable() {
    this.disableStep.set('confirm');
  }

  cancelDisable() {
    this.disableStep.set('idle');
    this.disablePassword = '';
  }

  onConfirmDigitInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    this.confirmDigits[index] = digit;
    input.value = digit;
    if (digit && index < 5) {
      this.confirmDigitInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  onConfirmDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.confirmDigits[index] && index > 0) {
      this.confirmDigits[index - 1] = '';
      this.confirmDigitInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  onConfirmDigitPaste(event: ClipboardEvent) {
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    const chars = pasted.slice(0, 6).split('');
    chars.forEach((char, i) => {
      this.confirmDigits[i] = char;
      const el = this.confirmDigitInputs.get(i)?.nativeElement;
      if (el) el.value = char;
    });
    this.confirmDigitInputs.get(Math.min(chars.length - 1, 5))?.nativeElement.focus();
  }

  confirmSetup() {
    if (this.confirmCode.length !== 6) return;
    this.busy.set(true);
    this.totpService.confirm(this.confirmCode).subscribe((result) => {
      this.busy.set(false);
      if (result === 'ok') {
        this.notificationService.success('Two-factor authentication enabled.');
        this.qrDataUrl.set(null);
        this.state.set('enabled');
      } else if (result === 'already_enabled') {
        this.notificationService.info('Two-factor authentication is already enabled.');
        this.qrDataUrl.set(null);
        this.state.set('enabled');
      } else {
        this.notificationService.error('Invalid confirmation code. Please try again.');
        this.confirmDigits = Array(6).fill('');
        this.confirmDigitInputs?.forEach((element) => {
          element.nativeElement.value = '';
        });
        this.confirmDigitInputs.get(0)?.nativeElement.focus();
      }
    });
  }

  disableTotp() {
    if (!this.disablePassword) return;
    this.busy.set(true);
    this.totpService.disable(this.disablePassword).subscribe((result) => {
      this.busy.set(false);
      if (result === 'ok') {
        this.notificationService.success('Two-factor authentication disabled.');
        this.disablePassword = '';
        this.state.set('disabled');
        this.disableStep.set('idle');
      } else if (result === 'invalid_password') {
        this.notificationService.error('Incorrect password. Please try again.');
        this.disablePassword = '';
      } else {
        this.notificationService.error(
          'Failed to disable two-factor authentication. Please try again later.',
        );
      }
    });
  }
}
