import { TestBed } from '@angular/core/testing';

import { SeoService } from '@app/shared/services/seo-service';

describe('SeoService', () => {
	let service: SeoService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(SeoService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
