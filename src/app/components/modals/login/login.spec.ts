import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Login } from './login';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AuthService } from '@services/auth/auth-service';
import { NotificationService } from '@services/notifications/notification-service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

describe('Login', () => {
	let component: Login;
	let fixture: ComponentFixture<Login>;
	let mockAuthService: {
		authenticate: ReturnType<typeof vi.fn>;
		verifyTotp: ReturnType<typeof vi.fn>;
		isAuthenticating: ReturnType<typeof signal>;
	};
	let mockNotificationService: {
		success: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
		verifyTotp: ReturnType<typeof vi.fn>;
	};
	let mockRouter: { navigate: ReturnType<typeof vi.fn> };

	beforeEach(async () => {
		mockAuthService = {
			authenticate: vi.fn().mockReturnValue(of('mfa_required')),
			verifyTotp: vi.fn().mockReturnValue(of(true)),
			isAuthenticating: signal(false),
		};
		mockNotificationService = {
			success: vi.fn(),
			error: vi.fn(),
			verifyTotp: vi.fn(),
		};
		mockRouter = { navigate: vi.fn() };
		await TestBed.configureTestingModule({
			imports: [Login],
			providers: [
				importProvidersFrom(FeatherModule.pick(allIcons)),
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: NotificationService, useValue: mockNotificationService },
				{ provide: Router, useValue: mockRouter },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Login);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	function fillValidForm() {
		component.loginData.username = 'testuser';
		component.loginData.password = 'testpassword';
	}

	function fillTotpDigits() {
		component.totpDigits = ['1', '2', '3', '4', '5', '6'];
	}

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should create on openModal()', () => {
		component.openModal();
		expect(component).toBeTruthy();
	});

	describe('onSubmit', () => {
		// login doesn't have a concept of 'touched'
		it('should call authService.login on valid credentials submit', () => {
			component.openModal();
			fillValidForm();
			component.onSubmit();
			expect(mockAuthService.authenticate).toHaveBeenCalledWith(
				component.loginData.username,
				component.loginData.password,
			);
		});
	});

	describe('submitCredentials', () => {
		it('should show generic error message on unsuccessful login', () => {
			mockAuthService.authenticate.mockReturnValue(of(''));
			component.openModal();
			fillValidForm();
			component.onSubmit();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Login failed. Please check your credentials.',
			);
		});

		it('should show success message on successful login', () => {
			mockAuthService.authenticate.mockReturnValue(of('success'));
			component.openModal();
			fillValidForm();
			component.onSubmit();

			expect(mockNotificationService.success).toHaveBeenCalledWith('Login successful!');
		});

		it('should close modal and navigate to /admin on successful login', () => {
			mockAuthService.authenticate.mockReturnValue(of('success'));
			component.openModal();
			fillValidForm();
			const closeModalSpy = vi.spyOn(component.loginModal, 'closeModal');
			const navigateSpy = mockRouter.navigate;
			component.onSubmit();

			expect(closeModalSpy).toHaveBeenCalled();
			expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
		});
	});

	describe('submitTotp', () => {
		it('should show error message on unsuccessful totp verification', () => {
			mockAuthService.verifyTotp.mockReturnValue(of(false));
			component.openModal();
			fillValidForm();
			component.onSubmit(); // submit credentials first to switch to totp step
			fillTotpDigits();
			component.onSubmit(); // submit totp

			expect(mockNotificationService.error).toHaveBeenLastCalledWith(
				'Invalid TOTP code. Please try again.',
			);
			expect(component.totpDigits).toEqual(['', '', '', '', '', '']);
		});

		it('should show success message, close, and navigate on successful totp verification', () => {
			mockAuthService.verifyTotp.mockReturnValue(of(true));
			const closeModalSpy = vi.spyOn(component.loginModal, 'closeModal');
			const navigateSpy = mockRouter.navigate;
			component.openModal();
			fillValidForm();
			component.onSubmit(); // submit credentials first to switch to totp step
			fillTotpDigits();
			component.onSubmit(); // submit totp

			expect(mockNotificationService.success).toHaveBeenLastCalledWith('Login successful!');
			expect(closeModalSpy).toHaveBeenCalled();
			expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
		});

		it('should call authService.login with totp code on totp submit', () => {
			component.openModal();
			fillValidForm();
			component.onSubmit(); // submit credentials first to switch to totp step
			fillTotpDigits();
			component.onSubmit(); // submit totp
			expect(mockAuthService.verifyTotp).toHaveBeenLastCalledWith(component.totpCode);
		});
	});

	describe('totpInput', () => {
		it('should move focus to next input on input', async () => {
			component.openModal();
			fillValidForm();
			component.onSubmit(); // submit credentials first to switch to totp step
			fixture.detectChanges();
			await fixture.whenStable();

			const inputs = document.querySelectorAll(
				'.otp-inputs input',
			) as NodeListOf<HTMLInputElement>;

			inputs[0].value = '1';
			inputs[0].dispatchEvent(new Event('input'));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(document.activeElement).toBe(inputs[1]);
		});

		it('should move focus to previous input on backspace', async () => {
			component.openModal();
			fillValidForm();
			component.onSubmit(); // submit credentials first to switch to totp step
			fixture.detectChanges();
			await fixture.whenStable();

			const inputs = document.querySelectorAll(
				'.otp-inputs input',
			) as NodeListOf<HTMLInputElement>;

			inputs[1].focus();
			inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
			fixture.detectChanges();
			await fixture.whenStable();

			expect(document.activeElement).toBe(inputs[0]);
		});

		it('should fill totpDigits array on clipboard paste', async () => {
			component.openModal();
			fillValidForm();
			component.onSubmit();
			fixture.detectChanges();
			await fixture.whenStable();

			const clipboardData = { getData: vi.fn().mockReturnValue('123456') };
			const pasteEvent = {
				clipboardData,
				preventDefault: vi.fn(),
			} as unknown as ClipboardEvent;

			component.onTotpDigitPaste(pasteEvent);

			expect(clipboardData.getData).toHaveBeenCalledWith('text');
			expect(component.totpDigits).toEqual(['1', '2', '3', '4', '5', '6']);
			expect(pasteEvent.preventDefault).toHaveBeenCalled();
		});
	});

	describe('template', () => {
		beforeEach(() => {
			component.openModal();
			fixture.detectChanges();
		});

		it('should render username and password inputs', () => {
			fillValidForm();
			fixture.detectChanges();
			const username = document.querySelector('input[name="username"]');
			const password = document.querySelector('input[name="password"]');

			expect(username).toBeTruthy();
			expect(password).toBeTruthy();
		});

		it('should reflect two-way binding for username and password', () => {
			const username = document.querySelector('input[name="username"]') as HTMLInputElement;
			const password = document.querySelector('input[name="password"]') as HTMLInputElement;

			username.value = 'testuser';
			username.dispatchEvent(new Event('input'));
			password.value = 'testpassword';
			password.dispatchEvent(new Event('input'));
			fixture.detectChanges();

			expect(component.loginData.username).toBe('testuser');
			expect(component.loginData.password).toBe('testpassword');
		});

		it('should disable submit button when isAuthenticating is true', () => {
			mockAuthService.isAuthenticating.set(true);
			fixture.detectChanges();

			const submitButton = document.querySelector(
				'.login-wrapper button',
			) as HTMLButtonElement;
			expect(submitButton.disabled).toBe(true);
		});

		it('should render TOTP inputs when on totp step', () => {
			component.onSubmit();
			fixture.detectChanges();

			const totpInputs = document.querySelectorAll('.otp-inputs input');
			expect(totpInputs.length).toBe(6);
		});
	});
});
