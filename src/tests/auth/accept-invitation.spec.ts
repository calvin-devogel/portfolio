import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AcceptInvitation } from '@app/auth/components/accept-invitation/accept-invitation';
import { AuthService } from '@app/auth/services/auth-service';
import { NotificationService } from '@app/shared/services/notification-service';

const makeActivatedRoute = (token: string | null) => ({
	snapshot: {
		queryParamMap: { get: (key: string) => (key === 'token' ? token : null) },
	},
});

describe('AcceptInvitation', () => {
	let component: AcceptInvitation;
	let fixture: ComponentFixture<AcceptInvitation>;
	let mockAuthService: { acceptInvitation: Mock };
	let mockNotificationService: { error: Mock; success: Mock };
	let mockRouter: { navigate: Mock };

	async function setup(token: string | null) {
		TestBed.resetTestingModule();

		mockAuthService = {
			acceptInvitation: vi.fn().mockReturnValue(of('ok')),
		};
		mockNotificationService = { error: vi.fn(), success: vi.fn() };
		mockRouter = { navigate: vi.fn() };

		await TestBed.configureTestingModule({
			imports: [AcceptInvitation],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: NotificationService, useValue: mockNotificationService },
				{ provide: Router, useValue: mockRouter },
				{ provide: ActivatedRoute, useValue: makeActivatedRoute(token) },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AcceptInvitation);
		component = fixture.componentInstance;
		await fixture.whenStable();
	}

	beforeEach(() => setup('test-token-abc'));

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should read token from query params and set state to form', () => {
		expect(component.token()).toBe('test-token-abc');
		expect(component.state()).toBe('form');
	});

	it('should set state to invalid when no token is present', async () => {
		await setup(null);
		expect(component.state()).toBe('invalid');
		expect(component.token()).toBeNull();
	});

	describe('onSubmit', () => {
		function fillValidForm() {
			component.formData.username = 'newuser';
			component.formData.password = 'SecurePass1!';
			component.formData.confirmPassword = 'SecurePass1!';
		}

		it('should show error and not call acceptInvitation when passwords do not match', () => {
			component.formData.username = 'newuser';
			component.formData.password = 'Pass1';
			component.formData.confirmPassword = 'Pass2';

			component.onSubmit();

			expect(mockNotificationService.error).toHaveBeenCalledWith('Passwords do not match.');
			expect(mockAuthService.acceptInvitation).not.toHaveBeenCalled();
		});

		it('should call acceptInvitation with token, username, and password', () => {
			fillValidForm();
			component.onSubmit();

			expect(mockAuthService.acceptInvitation).toHaveBeenCalledWith(
				'test-token-abc',
				'newuser',
				'SecurePass1!',
			);
		});

		it('should set state to success on ok result', async () => {
			fillValidForm();
			component.onSubmit();
			await fixture.whenStable();

			expect(component.state()).toBe('success');
		});

		it('should show error notification on invalid result', async () => {
			mockAuthService.acceptInvitation.mockReturnValue(of('invalid'));
			fillValidForm();
			component.onSubmit();
			await fixture.whenStable();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'This invitation link is invalid or has expired.',
			);
			expect(component.state()).toBe('form');
		});

		it('should show generic error notification on error result', async () => {
			mockAuthService.acceptInvitation.mockReturnValue(of('error'));
			fillValidForm();
			component.onSubmit();
			await fixture.whenStable();

			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Something went wrong. Please try again.',
			);
		});

		it('should set busy while submitting and clear it on completion', async () => {
			const subject = new Subject<string>();
			mockAuthService.acceptInvitation.mockReturnValue(subject.asObservable());
			fillValidForm();

			component.onSubmit();
			expect(component.busy()).toBe(true);

			subject.next('ok');
			await fixture.whenStable();
			expect(component.busy()).toBe(false);
		});
	});

	describe('goToHome', () => {
		it('should navigate to /', () => {
			component.goToHome();
			expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
		});
	});
});
