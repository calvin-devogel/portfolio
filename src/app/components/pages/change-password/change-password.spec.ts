import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { of, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { ChangePassword } from './change-password';
import { AuthService } from '@services/auth/auth-service';
import { NotificationService } from '@services/notifications/notification-service';

describe('ChangePassword', () => {
	let component: ChangePassword;
	let fixture: ComponentFixture<ChangePassword>;
	let mockAuthService: { changePassword: Mock; logout: Mock };
	let mockNotificationService: { error: Mock; success: Mock };
	let mockRouter: { navigate: Mock };

	beforeEach(async () => {
		mockAuthService = {
			changePassword: vi.fn().mockReturnValue(of('ok')),
			logout: vi.fn().mockReturnValue(of(void 0)),
		};
		mockNotificationService = { error: vi.fn(), success: vi.fn() };
		mockRouter = { navigate: vi.fn() };

		await TestBed.configureTestingModule({
			imports: [ChangePassword],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: NotificationService, useValue: mockNotificationService },
				{ provide: Router, useValue: mockRouter },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ChangePassword);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('passwordMismatch', () => {
		it('should be false when both fields are empty', () => {
			expect(component.passwordMismatch()).toBe(false);
		});

		it('should be false when passwords match', () => {
			component.formData.newPassword = 'same';
			component.formData.confirmNewPassword = 'same';
			expect(component.passwordMismatch()).toBe(false);
		});

		it('should be true when passwords differ', () => {
			component.formData.newPassword = 'abc';
			component.formData.confirmNewPassword = 'xyz';
			expect(component.passwordMismatch()).toBe(true);
		});
	});

	describe('onSubmit', () => {
		function fillValidForm() {
			component.formData.currentPassword = 'OldPass123!';
			component.formData.newPassword = 'NewPass456!';
			component.formData.confirmNewPassword = 'NewPass456!';
		}

		it('should show error and not call changePassword when passwords do not match', () => {
			component.formData.currentPassword = 'OldPass';
			component.formData.newPassword = 'NewPass1';
			component.formData.confirmNewPassword = 'NewPass2';

			component.onSubmit();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'New password and confirmation do not match.',
			);
			expect(mockAuthService.changePassword).not.toHaveBeenCalled();
		});

		it('should call changePassword with current and new password', () => {
			fillValidForm();
			component.onSubmit();

			expect(mockAuthService.changePassword).toHaveBeenCalledWith(
				'OldPass123!',
				'NewPass456!',
			);
		});

		it('should show success, log out, and navigate to / on ok', async () => {
			fillValidForm();
			component.onSubmit();
			await fixture.whenStable();

			expect(mockNotificationService.success).toHaveBeenCalledWith(
				'Password changed successfully. Please log in again.',
			);
			expect(mockAuthService.logout).toHaveBeenCalled();
			expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
		});

		it('should show error on wrong_password', async () => {
			mockAuthService.changePassword.mockReturnValue(of('wrong_password'));
			fillValidForm();
			component.onSubmit();
			await fixture.whenStable();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Current password is incorrect. Please try again.',
			);
			expect(mockRouter.navigate).not.toHaveBeenCalled();
		});

		it('should show generic error on error', async () => {
			mockAuthService.changePassword.mockReturnValue(of('error'));
			fillValidForm();
			component.onSubmit();
			await fixture.whenStable();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'An error occurred. Please try again later.',
			);
		});

		it('should set busy while submitting and clear it on completion', async () => {
			const subject = new Subject<string>();
			mockAuthService.changePassword.mockReturnValue(subject.asObservable());
			fillValidForm();

			component.onSubmit();
			expect(component.busy()).toBe(true);

			subject.next('ok');
			await fixture.whenStable();
			expect(component.busy()).toBe(false);
		});
	});
});
