import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { AccountSettings } from '@app/admin/components/account-settings/account-settings';
import { NotificationService } from '@app/shared/services/notification-service';
import { TotpService } from '@app/auth/services/totp-service';
import { of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import QRCode from 'qrcode';

describe('AccountSettings', () => {
	let component: AccountSettings;
	let fixture: ComponentFixture<AccountSettings>;

	let mockNotificationService: {
		success: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
		info: ReturnType<typeof vi.fn>;
		verifyTotp: ReturnType<typeof vi.fn>;
	};

	let mockTotpService: {
		getStatus: ReturnType<typeof vi.fn>;
		setup: ReturnType<typeof vi.fn>;
		confirm: ReturnType<typeof vi.fn>;
		disable: ReturnType<typeof vi.fn>;
	};

	beforeEach(async () => {
		mockTotpService = {
			getStatus: vi.fn().mockReturnValue(of({ totp_enabled: false })),
			setup: vi.fn().mockReturnValue(of('otpauth://example')),
			confirm: vi.fn().mockReturnValue(of('ok')),
			disable: vi.fn().mockReturnValue(of('ok')),
		};

		mockNotificationService = {
			success: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			verifyTotp: vi.fn(),
		};

		await TestBed.configureTestingModule({
			imports: [AccountSettings],
			providers: [
				importProvidersFrom(FeatherModule.pick(allIcons)),
				{ provide: TotpService, useValue: mockTotpService },
				{ provide: NotificationService, useValue: mockNotificationService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AccountSettings);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('ngOnInit', () => {
		it('should set state to disabled if TOTP is not enabled', () => {
			component.ngOnInit();
			expect(component.state()).toBe('disabled');
		});

		it('should set state to enabled if TOTP is enabled', () => {
			mockTotpService.getStatus.mockReturnValue(of({ totp_enabled: true }));
			component.ngOnInit();
			expect(component.state()).toBe('enabled');
		});

		it('should show error notification if status load fails', () => {
			mockTotpService.getStatus.mockReturnValue(of(null));
			component.ngOnInit();
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Failed to load account settings.',
			);
			expect(component.state()).toBe('disabled');
		});
	});

	describe('setup', () => {
		it('should generate a QR code and set state to setup-pending', async () => {
			vi.spyOn(QRCode, 'toDataURL').mockResolvedValueOnce(
				'data:image/png;base64,example' as never,
			);
			const setup$ = new Subject<string>();
			mockTotpService.setup.mockReturnValue(setup$.asObservable());
			component.startSetup();
			expect(component.busy()).toBe(true);

			setup$.next('otpauth://example');
			setup$.complete();

			await fixture.whenStable();

			expect(component.busy()).toBe(false);
			expect(component.state()).toBe('setup-pending');
			expect(component.qrDataUrl()).toBe('data:image/png;base64,example');
		});

		it('should show error and not change state if setup returns null', async () => {
			mockTotpService.setup.mockReturnValue(of(null));
			component.startSetup();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Failed to initiate 2FA setup.',
			);
			expect(component.busy()).toBe(false);
			expect(component.state()).toBe('disabled');
		});

		it('should show error if QR code generation fails', async () => {
			vi.spyOn(QRCode, 'toDataURL').mockRejectedValueOnce(new Error('canvas error'));

			component.startSetup();
			await fixture.whenStable();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Failed to generate QR code.',
			);
			expect(component.busy()).toBe(false);
			expect(component.state()).toBe('disabled');
			expect(component.qrDataUrl()).toBeNull();
		});

		it('should reset state and clear data on cancel', () => {
			component.state.set('setup-pending');
			component.qrDataUrl.set('data:image/png;base64,example');
			component.confirmDigits = ['1', '2', '3', '4', '5', '6'];
			component.disablePassword = 'password';
			component.cancelSetup();

			expect(component.state()).toBe('disabled');
			expect(component.qrDataUrl()).toBeNull();
			expect(component.confirmDigits).toEqual(['', '', '', '', '', '']);
			expect(component.disablePassword).toBe('');
		});

		describe('confirm digit input', () => {
			it('should update confirmDigits with only the last digit entered', () => {
				const inputEvent = {
					target: { value: '12a3' },
				} as unknown as Event;

				component.onConfirmDigitInput(0, inputEvent);
				expect(component.confirmDigits[0]).toBe('3');
			});

			it('should move focus to next input on valid digit entry', () => {
				const mockInputs = Array.from({ length: 6 }, () => {
					const element = document.createElement('input');
					return { nativeElement: element };
				});

				const focusSpy = vi.spyOn(mockInputs[1].nativeElement, 'focus');

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(component as any).confirmDigitInputs = {
					get: (i: number) => mockInputs[i],
				};

				const inputEvent = {
					target: { value: '5' },
				} as unknown as Event;

				component.onConfirmDigitInput(0, inputEvent);
				expect(focusSpy).toHaveBeenCalled();
			});

			it('should move focus to the previous input on backspace if the current digit is empty', () => {
				const mockInputs = Array.from({ length: 6 }, () => {
					const element = document.createElement('input');
					return { nativeElement: element };
				});

				const focusSpy = vi.spyOn(mockInputs[0].nativeElement, 'focus');

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(component as any).confirmDigitInputs = {
					get: (i: number) => mockInputs[i],
				};

				component.confirmDigits[1] = '';
				const keydownEvent = new KeyboardEvent('keydown', { key: 'Backspace' });

				component.onConfirmDigitKeydown(1, keydownEvent);
				expect(focusSpy).toHaveBeenCalled();
				expect(component.confirmDigits[0]).toBe('');
			});

			it('should fill confirmDigits array on clipboard paste', () => {
				const mockInputs = Array.from({ length: 6 }, () => {
					const element = document.createElement('input');
					return { nativeElement: element };
				});

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(component as any).confirmDigitInputs = {
					get: (i: number) => mockInputs[i],
				};

				const clipboardData = { getData: vi.fn().mockReturnValue('123456') };
				const pasteEvent = {
					clipboardData,
					preventDefault: vi.fn(),
				} as unknown as ClipboardEvent;

				component.onConfirmDigitPaste(pasteEvent);

				expect(clipboardData.getData).toHaveBeenCalledWith('text');
				expect(component.confirmDigits).toEqual(['1', '2', '3', '4', '5', '6']);
				expect(pasteEvent.preventDefault).toHaveBeenCalled();
			});
		});
	});

	describe('disable', () => {
		it('should set disableStep to confirm on startDisable', () => {
			component.startDisable();
			expect(component.disableStep()).toBe('confirm');
		});

		it('should reset disableStep and clear password on cancelDisable', () => {
			component.disableStep.set('confirm');
			component.disablePassword = 'password';
			component.cancelDisable();

			expect(component.disableStep()).toBe('idle');
			expect(component.disablePassword).toBe('');
		});

		it('should show error notification if disable fails due to incorrect password', () => {
			mockTotpService.disable.mockReturnValue(of('invalid_password'));
			component.disablePassword = 'wrongpassword';
			component.disableTotp();

			expect(mockTotpService.disable).toHaveBeenCalledWith('wrongpassword');
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Incorrect password. Please try again.',
			);
			expect(component.state()).toBe('disabled');
		});

		it('should show generic error notification for unexpected errors', () => {
			mockTotpService.disable.mockReturnValue(of('unknown_error'));
			component.disablePassword = 'correctpassword';
			component.disableTotp();

			expect(mockTotpService.disable).toHaveBeenCalledWith('correctpassword');
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Failed to disable two-factor authentication. Please try again later.',
			);
			expect(component.state()).toBe('disabled');
		});

		it('should return early if called without a password', () => {
			component.disablePassword = '';
			component.disableTotp();

			expect(mockTotpService.disable).not.toHaveBeenCalled();
			expect(component.state()).toBe('disabled');
			expect(component.disableStep()).toBe('idle');
		});

		it('should call TotpService.disable with the entered password and show success notification', () => {
			component.disablePassword = 'password';
			component.disableTotp();

			expect(mockTotpService.disable).toHaveBeenCalledWith('password');
			expect(mockNotificationService.success).toHaveBeenCalledWith(
				'Two-factor authentication disabled.',
			);
			expect(component.state()).toBe('disabled');
			expect(component.disableStep()).toBe('idle');
		});

		it('should show error notification if disable fails', () => {
			mockTotpService.disable.mockReturnValue(of('invalid_password'));
			component.disablePassword = 'wrongpassword';
			component.disableTotp();

			expect(mockTotpService.disable).toHaveBeenCalledWith('wrongpassword');
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Incorrect password. Please try again.',
			);
			expect(component.state()).toBe('disabled');
		});
	});

	describe('confirm', () => {
		it('should call TotpService.confirm with the entered code and show success notification', () => {
			component.confirmDigits = ['1', '2', '3', '4', '5', '6'];
			component.confirmSetup();

			expect(mockTotpService.confirm).toHaveBeenCalledWith('123456');
			expect(mockNotificationService.success).toHaveBeenCalledWith(
				'Two-factor authentication enabled.',
			);
			expect(component.qrDataUrl()).toBeNull();
			expect(component.state()).toBe('enabled');
		});

		it('should show info notification if 2FA is already enabled', () => {
			mockTotpService.confirm.mockReturnValue(of('already_enabled'));
			component.confirmDigits = ['1', '2', '3', '4', '5', '6'];
			component.confirmSetup();

			expect(mockTotpService.confirm).toHaveBeenCalledWith('123456');
			expect(mockNotificationService.info).toHaveBeenCalledWith(
				'Two-factor authentication is already enabled.',
			);
			expect(component.qrDataUrl()).toBeNull();
			expect(component.state()).toBe('enabled');
		});

		it('should show error notification if confirmation fails', () => {
			mockTotpService.confirm.mockReturnValue(of('error'));
			component.confirmDigits = ['1', '2', '3', '4', '5', '6'];
			component.confirmSetup();

			expect(mockTotpService.confirm).toHaveBeenCalledWith('123456');
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Invalid confirmation code. Please try again.',
			);
			expect(component.confirmDigits).toEqual(['', '', '', '', '', '']);
		});

		it('should return early if confirmation code is not 6 digits', () => {
			component.confirmDigits = ['1', '2', '3'];
			component.confirmSetup();

			expect(mockTotpService.confirm).not.toHaveBeenCalled();
		});

		it('should show error and reset inputs if confirmation code is invalid', () => {
			mockTotpService.confirm.mockReturnValue(of('error'));
			component.confirmDigits = ['1', '2', '3', '4', '5', '6'];
			component.confirmSetup();

			expect(mockTotpService.confirm).toHaveBeenCalledWith('123456');
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Invalid confirmation code. Please try again.',
			);
			expect(component.confirmDigits).toEqual(['', '', '', '', '', '']);
		});
	});

	describe('template', () => {
		it('should show a loading box when state is loading', () => {
			component.state.set('loading');
			fixture.detectChanges();
			const box = fixture.nativeElement.querySelector('.box');
			expect(box.textContent.trim()).toBe('Loading...');
		});

		describe('disabled state', () => {
			beforeEach(() => {
				component.state.set('disabled');
				fixture.detectChanges();
			});

			it('should render the "Not enabled" subtitle', () => {
				const subtitle = fixture.nativeElement.querySelector('.settings-card__subtitle');
				expect(subtitle.textContent).toContain('Not enabled');
			});

			it('should show the Enable 2FA button', () => {
				const button = fixture.nativeElement.querySelector('.pill-button');
				expect(button.textContent.trim()).toBe('Enable 2FA');
			});

			it('should disable the Enable 2FA button when busy', () => {
				component.busy.set(true);
				fixture.detectChanges();
				const button = fixture.nativeElement.querySelector('.pill-button');
				expect(button.disabled).toBe(true);
			});

			it('should apply is-loading class to Enable 2FA button when busy', () => {
				component.busy.set(true);
				fixture.detectChanges();
				const button = fixture.nativeElement.querySelector('.pill-button');
				expect(button.classList).toContain('is-loading');
			});

			it('should call startSetup when Enable 2FA is clicked', () => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				vi.spyOn(component, 'startSetup').mockImplementation(() => {});
				fixture.nativeElement.querySelector('.pill-button').click();
				expect(component.startSetup).toHaveBeenCalled();
			});
		});

		describe('enabled state', () => {
			beforeEach(() => {
				component.state.set('enabled');
				component.disableStep.set('idle');
				fixture.detectChanges();
			});

			it('should render the "Active" subtitle', () => {
				const subtitle = fixture.nativeElement.querySelector('.settings-card__subtitle');
				expect(subtitle.textContent).toContain('Active');
			});

			it('should show the Disable 2FA button when disableStep is idle', () => {
				const button = fixture.nativeElement.querySelector('.pill-button');
				expect(button.textContent.trim()).toBe('Disable 2FA');
			});

			it('should disable the Disable 2FA button when busy', () => {
				component.busy.set(true);
				fixture.detectChanges();
				const button = fixture.nativeElement.querySelector('.pill-button');
				expect(button.disabled).toBe(true);
			});

			it('should call startDisable when Disable 2FA is clicked', () => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				vi.spyOn(component, 'startDisable').mockImplementation(() => {});
				fixture.nativeElement.querySelector('.pill-button').click();
				expect(component.startDisable).toHaveBeenCalled();
			});

			it('should not show the password form when disableStep is idle', () => {
				expect(fixture.nativeElement.querySelector('input[type="password"]')).toBeNull();
			});

			describe('confirm disable step', () => {
				beforeEach(() => {
					component.disableStep.set('confirm');
					fixture.detectChanges();
				});

				it('should show the password input and prompt label', () => {
					expect(
						fixture.nativeElement.querySelector('input[type="password"]'),
					).toBeTruthy();
					const label = fixture.nativeElement.querySelector('.disable-label');
					expect(label.textContent).toContain('Enter your password to confirm');
				});

				it('should not show the Disable 2FA button', () => {
					const buttons = fixture.nativeElement.querySelectorAll('.pill-button');
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const labels = Array.from(buttons).map((b: any) => b.textContent.trim());
					expect(labels).not.toContain('Disable 2FA');
				});

				it('should disable the Confirm Disable button when password is empty', () => {
					component.disablePassword = '';
					fixture.detectChanges();
					const submit = fixture.nativeElement.querySelector('button[type="submit"]');
					expect(submit.disabled).toBe(true);
				});

				it('should enable the Confirm Disable button when a password is entered', () => {
					component.disablePassword = 'mypassword';
					fixture.detectChanges();
					const submit = fixture.nativeElement.querySelector('button[type="submit"]');
					expect(submit.disabled).toBe(false);
				});

				it('should disable and show loading on Confirm Disable button when busy', () => {
					component.disablePassword = 'secret';
					component.busy.set(true);
					fixture.detectChanges();
					const submit = fixture.nativeElement.querySelector('button[type="submit"]');
					expect(submit.disabled).toBe(true);
					expect(submit.classList).toContain('is-loading');
				});

				it('should call disableTotp when the Confirm Disable button is clicked', () => {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					vi.spyOn(component, 'disableTotp').mockImplementation(() => {});
					component.disablePassword = 'secret';
					fixture.detectChanges();
					fixture.nativeElement.querySelector('button[type="submit"]').click();
					expect(component.disableTotp).toHaveBeenCalled();
				});

				it('should call cancelDisable when Cancel is clicked', () => {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					vi.spyOn(component, 'cancelDisable').mockImplementation(() => {});
					fixture.nativeElement.querySelector('button[type="button"]').click();
					expect(component.cancelDisable).toHaveBeenCalled();
				});

				it('should disable the Cancel button when busy', () => {
					component.busy.set(true);
					fixture.detectChanges();
					const cancel = fixture.nativeElement.querySelector('button[type="button"]');
					expect(cancel.disabled).toBe(true);
				});

				it('should bind the password input to disablePassword via ngModel', async () => {
					const input: HTMLInputElement =
						fixture.nativeElement.querySelector('input[type="password"]');
					input.value = 'typed-password';
					input.dispatchEvent(new Event('input'));
					fixture.detectChanges();
					await fixture.whenStable();
					expect(component.disablePassword).toBe('typed-password');
				});
			});
		});
	});
});
