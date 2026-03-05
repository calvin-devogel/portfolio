import { Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { NotificationService } from '../../../services/notifications/notification-service';
import { Subscription } from 'rxjs';
import { ModalTemplate } from "@components/modals/modal-template/modal-template";

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
  notificationService = inject(NotificationService);
  loginData = { username: '', password: '' };

  private subscription: Subscription = new Subscription();
  
  openModal() {
    this.loginModal.openModal();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSubmit() {
    const sub = this.authService.authenticate(this.loginData.username, this.loginData.password).subscribe(success => {
      if (success) {
        // Handle successful login, e.g., navigate to a different page
        this.notificationService.success('Login successful!');
        this.loginModal.closeModal();
        this.router.navigate(['/admin']);
      } else {
        // Handle failed login, e.g., show an error message
        this.notificationService.error('Invalid username or password.');
      }
    });
    this.subscription.add(sub);
  }
}
