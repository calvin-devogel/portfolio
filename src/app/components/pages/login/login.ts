import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageLayout } from "../../page-layout/page-layout";
import { AuthService } from '../../../services/auth/auth-service';
import { NotificationService } from '../../../services/notifications/notification-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [PageLayout, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  notificationService = inject(NotificationService);
  loginData = { username: '', password: '' };

  private subscription: Subscription = new Subscription();
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
   }
  onSubmit() {
    const sub = this.authService.authenticate(this.loginData.username, this.loginData.password).subscribe(success => {
      if (success) {
        // Handle successful login, e.g., navigate to a different page
        this.notificationService.success('Login successful!');
        this.router.navigate(['/admin']);
      } else {
        // Handle failed login, e.g., show an error message
        this.notificationService.error('Invalid username or password.');
      }
    });
    this.subscription.add(sub);
  }
}
