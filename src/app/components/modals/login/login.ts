import {
  Component,
  inject,
  OnDestroy,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { NotificationService } from '../../../services/notifications/notification-service';
import { Subscription } from 'rxjs';
import { ModalTemplate } from '@components/modals/modal-template/modal-template';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ModalTemplate],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  @ViewChild('loginModal') loginModal!: ModalTemplate;
  @ViewChildren('totpDigitInput') private totpDigitInputs!: QueryList<ElementRef<HTMLInputElement>>;
  notificationService = inject(NotificationService);

  loginData = { username: '', password: '' };
  totpDigits: string[] = Array(6).fill('');
  get totpCode(): string {
    return this.totpDigits.join('');
  }
  step = signal<'credentials' | 'totp'>('credentials');

  private subscription: Subscription = new Subscription();

  openModal() {
    this.step.set('credentials');
    this.totpDigits = Array(6).fill('');
    this.loginModal.openModal();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSubmit() {
    if (this.step() === 'credentials') {
      this.submitCredentials();
    } else {
      this.submitTotp();
    }
  }

  onTotpDigitInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    this.totpDigits[index] = digit;
    input.value = digit;
    if (digit && index < 5) {
      this.totpDigitInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  onTotpDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.totpDigits[index] && index > 0) {
      this.totpDigits[index - 1] = '';
      this.totpDigitInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  onTotpDigitPaste(event: ClipboardEvent) {
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    const chars = pasted.slice(0, 6).split('');
    chars.forEach((char, i) => {
      this.totpDigits[i] = char;
      const el = this.totpDigitInputs.get(i)?.nativeElement;
      if (el) el.value = char;
    });
    this.totpDigitInputs.get(Math.min(chars.length - 1, 5))?.nativeElement.focus();
  }

  private submitCredentials() {
    const sub = this.authService
      .authenticate(this.loginData.username, this.loginData.password)
      .subscribe((result) => {
        if (result === 'success') {
          this.notificationService.success('Login successful!');
          this.loginModal.closeModal();
          this.router.navigate(['/admin']);
        } else if (result === 'mfa_required') {
          this.step.set('totp');
        } else {
          this.notificationService.error('Login failed. Please check your credentials.');
        }
      });
    this.subscription.add(sub);
  }

  private submitTotp() {
    const sub = this.authService.verifyTotp(this.totpCode).subscribe((success) => {
      if (success) {
        this.notificationService.success('Login successful!');
        this.loginModal.closeModal();
        this.router.navigate(['/admin']);
      } else {
        this.notificationService.error('Invalid TOTP code. Please try again.');
        this.totpDigits = Array(6).fill('');
        this.totpDigitInputs.get(0)?.nativeElement.focus();
      }
    });
    this.subscription.add(sub);
  }
}
