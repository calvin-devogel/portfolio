import { Component, OnDestroy, inject, ElementRef, afterNextRender } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NotificationService } from '@app/shared/services/notification-service';
import { FeatherModule } from 'angular-feather';

@Component({
	selector: 'app-notification-toast',
	imports: [FeatherModule],
	templateUrl: './notification-toast.html',
	styleUrl: './notification-toast.scss',
})
export class NotificationToast implements OnDestroy {
	private elementRef = inject(ElementRef);
	private document = inject(DOCUMENT);
	notificationService = inject(NotificationService);

	constructor() {
		afterNextRender(() => {
			this.document.body.appendChild(this.elementRef.nativeElement);
		});
	}

	ngOnDestroy(): void {
		this.elementRef.nativeElement.remove();
	}
}
