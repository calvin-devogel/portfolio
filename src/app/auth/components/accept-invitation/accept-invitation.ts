import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/auth/services/auth-service';
import { NotificationService } from '@app/shared/services/notification-service';

@Component({
	selector: 'app-accept-invitation',
	imports: [CommonModule, FormsModule],
	templateUrl: './accept-invitation.html',
	styleUrl: './accept-invitation.scss',
})
export class AcceptInvitation implements OnInit {
	private route = inject(ActivatedRoute);
	private authService = inject(AuthService);
	private notificationService = inject(NotificationService);
	private router = inject(Router);

	token = signal<string | null>(null);
	state = signal<'form' | 'success' | 'invalid'>('form');
	busy = signal(false);

	formData = { username: '', password: '', confirmPassword: '' };

	ngOnInit() {
		const token = this.route.snapshot.queryParamMap.get('token');
		if (!token) {
			this.state.set('invalid');
		} else {
			this.token.set(token);
		}
	}

	onSubmit() {
		if (this.formData.password !== this.formData.confirmPassword) {
			this.notificationService.error('Passwords do not match.');
			return;
		}

		const token = this.token();
		if (!token) return;

		this.busy.set(true);

		this.authService
			.acceptInvitation(token, this.formData.username, this.formData.password)
			.subscribe((result) => {
				this.busy.set(false);
				if (result === 'ok') {
					this.state.set('success');
				} else if (result === 'invalid') {
					this.notificationService.error(
						'This invitation link is invalid or has expired.',
					);
				} else {
					this.notificationService.error('Something went wrong. Please try again.');
				}
			});
	}

	goToHome() {
		this.router.navigate(['/']);
	}
}
