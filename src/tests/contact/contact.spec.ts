import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Contact } from '@app/contact/components/contact/contact';

import { describe, it, expect, beforeEach } from 'vitest';
import { throwError, of } from 'rxjs';
import { MessageService } from '@app/contact/services/message-service';
import { NotificationService } from '@app/shared/services/notification-service';

describe('Contact', () => {
	let component: Contact;
	let fixture: ComponentFixture<Contact>;
	let mockMessageService: { sendMessage: ReturnType<typeof vi.fn> };
	let mockNotificationService: {
		success: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
	};

	beforeEach(async () => {
		mockMessageService = { sendMessage: vi.fn() };
		mockNotificationService = {
			success: vi.fn(),
			error: vi.fn(),
		};

		await TestBed.configureTestingModule({
			imports: [Contact],
			providers: [
				importProvidersFrom(FeatherModule.pick(allIcons)),
				{ provide: MessageService, useValue: mockMessageService },
				{ provide: NotificationService, useValue: mockNotificationService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Contact);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	function fillValidForm() {
		component.contactForm.setValue({
			sender_name: 'Test User',
			email: 'test@email.com',
			message_text: 'This is a test message.',
		});
	}

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should create on openModal()', () => {
		component.openModal();
		expect(component).toBeTruthy();
	});

	describe('onSubmit', () => {
		it('should mark form group as touched on invalid submit', () => {
			component.onSubmit();

			expect(component.contactForm.get('sender_name')?.touched).toBe(true);
			expect(component.contactForm.get('email')?.touched).toBe(true);
			expect(component.contactForm.get('message_text')?.touched).toBe(true);
		});

		it('should set submitSuccess to true and reset form on valid submit', () => {
			mockMessageService.sendMessage.mockReturnValue(
				of({ message: 'Success', message_id: '123' }),
			);
			fillValidForm();
			component.onSubmit();

			expect(component.submitSuccess).toBe(true);
			expect(component.isSubmitting).toBe(false);
			expect(mockNotificationService.success).toHaveBeenCalled();
		});

		it('should show generic error message on unknown error', () => {
			mockMessageService.sendMessage.mockReturnValue(throwError(() => ({ status: 500 })));
			fillValidForm();
			component.onSubmit();

			expect(component.isSubmitting).toBe(false);
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Failed to send message. Please try again.',
			);
		});

		it('should show specific error messages on known errors', () => {
			mockMessageService.sendMessage.mockReturnValue(throwError(() => ({ status: 400 })));
			fillValidForm();
			component.onSubmit();

			expect(component.isSubmitting).toBe(false);
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Invalid input. Please check your submission and try again.',
			);

			mockMessageService.sendMessage.mockReturnValue(throwError(() => ({ status: 429 })));
			fillValidForm();
			component.onSubmit();

			expect(component.isSubmitting).toBe(false);
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				'Rate limit exceeded. Please try again later.',
			);
		});
	});

	describe('ngOnDestroy', () => {
		it('should unsubscribe from subscription', () => {
			mockMessageService.sendMessage.mockReturnValue(
				of({
					message: 'Success',
					message_id: '123',
				}),
			);
			fillValidForm();
			component.onSubmit();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spy = vi.spyOn((component as any).subscription, 'unsubscribe');
			component.ngOnDestroy();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('form validation', () => {
		it('should be invalid when empty', () => {
			expect(component.contactForm.valid).toBe(false);
		});

		it('should validate sender_name field', () => {
			const senderNameControl = component.contactForm.get('sender_name');
			senderNameControl?.setValue('');
			expect(senderNameControl?.valid).toBe(false);

			senderNameControl?.setValue('A');
			expect(senderNameControl?.valid).toBe(false);

			senderNameControl?.setValue('Valid Name');
			expect(senderNameControl?.valid).toBe(true);
		});

		it('should validate email field', () => {
			const emailControl = component.contactForm.get('email');
			emailControl?.setValue('');
			expect(emailControl?.valid).toBe(false);

			emailControl?.setValue('invalid-email');
			expect(emailControl?.valid).toBe(false);

			emailControl?.setValue('test@email.com');
			expect(emailControl?.valid).toBe(true);
		});
	});

	describe('getters', () => {
		it('should return form controls', () => {
			expect(component.sender_name).toBe(component.contactForm.get('sender_name'));
			expect(component.email).toBe(component.contactForm.get('email'));
			expect(component.message_text).toBe(component.contactForm.get('message_text'));
		});
	});

	describe('template', () => {
		it('should show name required error when sender_name is touched and empty', async () => {
			component.openModal();
			component.contactForm.get('sender_name')?.markAsTouched();
			fixture.detectChanges();
			await fixture.whenStable();

			// modals are attached to document.body via this.document.body.appendChild(node)
			// so they're never inside fixture.nativElement. The document must be queried
			// directly to find the error element.
			const error = document.querySelector('#sender_name-error');
			expect(error).toBeTruthy();
			expect(error?.textContent).toContain('Name is required');
		});

		it('should apply is-danger class to input when field is invalid and touched', async () => {
			component.openModal();
			component.contactForm.get('email')?.markAsTouched();
			fixture.detectChanges();
			await fixture.whenStable();

			const input = document.querySelector('#email');
			expect(input).toBeTruthy();
			expect(input?.classList).toContain('is-danger');
		});

		it('should set aria-invalid when field is invalid and touched', async () => {
			component.openModal();
			component.contactForm.get('message_text')?.markAsTouched();
			fixture.detectChanges();
			await fixture.whenStable();

			const input = document.querySelector('#message_text');
			expect(input).toBeTruthy();
			expect(input?.getAttribute('aria-invalid')).toBe('true');
		});

		it('should disable the submit button while submitting', () => {
			component.openModal();
			component.isSubmitting = true;
			fixture.detectChanges();

			const button = document.querySelector('button[type="submit"]');
			expect(button?.classList.contains('disabled'));
			expect(button?.classList).toContain('is-loading');
			expect(button?.textContent).toContain('Sending...');
		});

		it('should call onSubmit when form is submitted', () => {
			const spy = vi.spyOn(component, 'onSubmit');
			component.openModal();
			// const form = document.querySelector('form');
			component.onSubmit();
			expect(spy).toHaveBeenCalled();
		});
	});
});
