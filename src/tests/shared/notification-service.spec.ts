import { TestBed } from '@angular/core/testing';

import { NotificationService } from '@app/shared/services/notification-service';

describe('NotificationServiceTs', () => {
	let service: NotificationService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(NotificationService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
