import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth/auth-service';
import { NotificationService } from '@services/notifications/notification-service';

@Component({
	selector: 'app-change-password',
	imports: [CommonModule, FormsModule],
	templateUrl: './change-password.html',
	styleUrl: './change-password.scss',
})
export class ChangePassword {
	private authService = inject(AuthService);
	private router = inject(Router);
	private notificationService = inject(NotificationService);

	formData = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
	busy = signal(false);

	passwordMismatch() {
		return (
			this.formData.newPassword !== '' &&
			this.formData.confirmNewPassword !== '' &&
			this.formData.newPassword !== this.formData.confirmNewPassword
		);
	}

	onSubmit() {
		if (this.passwordMismatch()) {
			this.notificationService.error('New password and confirmation do not match.');
			return;
		}

		this.busy.set(true);
		this.authService
			.changePassword(this.formData.currentPassword, this.formData.newPassword)
			.subscribe((result) => {
				if (result === 'ok') {
					this.notificationService.success(
						'Password changed successfully. Please log in again.',
					);
					this.authService.logout().subscribe(() => {
						this.router.navigate(['/']);
					});
				} else if (result === 'wrong_password') {
					this.notificationService.error(
						'Current password is incorrect. Please try again.',
					);
				} else {
					this.notificationService.error('An error occurred. Please try again later.');
				}
				this.busy.set(false);
			});
	}
}
