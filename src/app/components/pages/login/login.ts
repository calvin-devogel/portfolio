import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageLayout } from "../../page-layout/page-layout";
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-login',
  imports: [PageLayout, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  authService = inject(AuthService);
  router = inject(Router);
  loginData = { username: '', password: '' };

  onSubmit() {
    this.authService.authenticate(this.loginData.username, this.loginData.password).subscribe(success => {
      if (success) {
        // Handle successful login, e.g., navigate to a different page
        this.router.navigate(['/admin']);
      } else {
        // Handle failed login, e.g., show an error message
        console.log('Login failed');
      }
    });
  }
}
