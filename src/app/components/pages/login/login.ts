import { Component, inject } from '@angular/core';
import { PageLayout } from "../../page-layout/page-layout";
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-login',
  imports: [PageLayout],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  authService = inject(AuthService);
  loginData = { username: '', password: '' };

  onSubmit() {
    this.authService.authenticate(this.loginData.username, this.loginData.password).subscribe(success => {
      if (success) {
        // Handle successful login, e.g., navigate to a different page
        console.log('Login successful');
      } else {
        // Handle failed login, e.g., show an error message
        console.log('Login failed');
      }
    });
  }
}
