import { TestBed } from '@angular/core/testing';

import { ResumeService } from '@app/resume/services/resume-service';

describe('ResumeService', () => {
	let service: ResumeService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ResumeService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
