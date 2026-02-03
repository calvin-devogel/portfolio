import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconsModule } from '../../modules/icons/icons-module';
import { AuthService } from '../../services/auth/auth-service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-nav',
  imports: [IconsModule, RouterLink, AsyncPipe],
  templateUrl: './nav.html',
  styleUrls: ['./nav.scss'],
})
export class Nav {
  public authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => console.error('Logout failed', err)
    })
  }
}
