import { Component, inject, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@app/auth/services/auth-service';
import { AsyncPipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { Login } from '@app/auth/components/login/login';

@Component({
	selector: 'app-nav',
	imports: [FeatherModule, RouterLink, RouterLinkActive, AsyncPipe, Login],
	templateUrl: './nav.html',
	styleUrls: ['./nav.scss'],
})
export class Nav {
	public authService = inject(AuthService);
	private router = inject(Router);
	@ViewChild('loginModal') loginModal!: Login;

	openLogin(): void {
		this.loginModal.openModal();
	}

	logout() {
		this.authService.logout().subscribe({
			next: () => this.router.navigate(['/']),
			error: (err) => console.error('Logout failed', err),
		});
	}
}
