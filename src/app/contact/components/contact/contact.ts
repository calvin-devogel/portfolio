import { Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { CreateMessageData } from '@app/contact/interfaces/message-data';
import { MessageService } from '@app/contact/services/message-service';
import { NotificationService } from '@app/shared/services/notification-service';
import { Subscription } from 'rxjs';
import { ModalTemplate } from '@app/shared/components/modal-template/modal-template';

@Component({
	selector: 'app-contact',
	imports: [ModalTemplate, CommonModule, FeatherModule, ReactiveFormsModule],
	templateUrl: './contact.html',
	styleUrls: ['./contact.scss'],
})
export class Contact implements OnDestroy {
	private messageService: MessageService = inject(MessageService);
	private notificationService: NotificationService = inject(NotificationService);
	private formBuilder: FormBuilder = inject(FormBuilder);
	@ViewChild('contactModal') contactModal!: ModalTemplate;

	contactForm: FormGroup;
	isSubmitting = false;
	submitSuccess = false;

	private subscription: Subscription = new Subscription();

	constructor() {
		this.contactForm = this.formBuilder.group({
			sender_name: [
				'',
				[Validators.required, Validators.minLength(2), Validators.maxLength(100)],
			],
			email: ['', [Validators.required, Validators.email]],
			message_text: [
				'',
				[Validators.required, Validators.minLength(10), Validators.maxLength(5000)],
			],
		});
	}

	openModal(): void {
		this.contactModal.openModal();
	}

	ngOnDestroy(): void {
		this.subscription.unsubscribe();
	}

	onSubmit(): void {
		if (this.contactForm.invalid) {
			this.markFormGroupTouched(this.contactForm);
			return;
		}

		this.isSubmitting = true;
		this.submitSuccess = false;

		const formData: CreateMessageData = {
			sender_name: this.contactForm.value.sender_name,
			email: this.contactForm.value.email,
			message_text: this.contactForm.value.message_text,
		};

		const sub = this.messageService.sendMessage(formData).subscribe({
			next: () => {
				this.isSubmitting = false;
				this.submitSuccess = true;
				this.contactForm.reset();
				this.notificationService.success(
					"Message sent successfully! I'll get back to you soon.",
				);
			},
			error: (error) => {
				this.isSubmitting = false;
				let errorMessage = 'Failed to send message. Please try again.';

				if (error.status === 429) {
					errorMessage = 'Rate limit exceeded. Please try again later.';
				} else if (error.status === 400) {
					errorMessage = 'Invalid input. Please check your submission and try again.';
				}

				this.notificationService.error(errorMessage);
			},
		});
		this.subscription.add(sub);
	}

	private markFormGroupTouched(formGroup: FormGroup): void {
		Object.keys(formGroup.controls).forEach((key) => {
			const control = formGroup.get(key);
			control?.markAsTouched();
		});
	}

	get sender_name() {
		return this.contactForm.get('sender_name');
	}
	get email() {
		return this.contactForm.get('email');
	}
	get message_text() {
		return this.contactForm.get('message_text');
	}
}
