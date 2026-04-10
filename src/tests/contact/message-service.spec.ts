import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from '@app/contact/services/message-service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MessageService', () => {
	let service: MessageService;
	let httpMock: HttpTestingController;

	const idempotencyKeyRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MessageService, provideHttpClient(), provideHttpClientTesting()],
		});
		service = TestBed.inject(MessageService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify(); // ensures no unexpected requests were made
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('sendMessage', () => {
		const mockMessage = {
			sender_name: 'John Doe',
			email: 'fake@email.com',
			message_text: 'This is a test message.',
		};

		it('should POST to /v1/contact with correct body', () => {
			const mockResponse = { message: 'sent', message_id: 'abc-123' };

			service.sendMessage(mockMessage).subscribe((response) => {
				expect(response).toEqual(mockResponse);
			});

			const req = httpMock.expectOne('/v1/contact');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toContain('email=fake%40email.com');
			expect(req.request.body).toContain('sender_name=John+Doe');
			expect(req.request.body).toContain('message_text=This+is+a+test+message.');
			req.flush(mockResponse);
		});

		it('should include a valid Idempotency-Key header', () => {
			service.sendMessage(mockMessage).subscribe();

			const req = httpMock.expectOne('/v1/contact');
			expect(req.request.headers.get('Idempotency-Key')).toMatch(idempotencyKeyRegex);
			req.flush({ message: 'sent', message_id: 'abc-123' });
		});
	});

	describe('getMessages', () => {
		it('should GET /v1/admin/messages with default params and normalize response', () => {
			const mockRaw = {
				messages: [
					{
						message_id: '1',
						sender_name: 'Alice',
						email: 'a@b.com',
						message_text: 'Hi',
						created_at: '2026-01-01',
					},
				],
				page: 0,
				page_size: 10,
				total_items: 1,
			};

			service.getMessages().subscribe((response) => {
				expect(response.messages.length).toBe(1);
				expect(response.page).toBe(0);
				expect(response.page_size).toBe(10);
				expect(response.total_items).toBe(1);
			});

			const req = httpMock.expectOne((r) => r.url === '/v1/admin/messages');
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('page')).toBe('0');
			expect(req.request.params.get('page_size')).toBe('10');
			req.flush(mockRaw);
		});

		it('should fall back to messages.length when total fields are missing', () => {
			const mockRaw = {
				messages: [
					{
						message_id: '1',
						sender_name: 'Alice',
						email: 'a@b.com',
						message_text: 'Hi',
						created_at: '2026-01-01',
					},
				],
			};

			service.getMessages().subscribe((response) => {
				expect(response.total_items).toBe(1);
			});

			const req = httpMock.expectOne((r) => r.url === '/v1/admin/messages');
			req.flush(mockRaw);
		});
	});

	describe('patchMessage', () => {
		it('should PATCH /v1/admin/messages with correct body and Idempotency-Key header', () => {
			service.patchMessage('msg-123', true).subscribe();

			const req = httpMock.expectOne('/v1/admin/messages');
			expect(req.request.method).toBe('PATCH');
			expect(req.request.body).toEqual({ message_id: 'msg-123', read: true });
			expect(req.request.headers.get('Idempotency-Key')).toMatch(idempotencyKeyRegex);
			req.flush(null);
		});
	});

	describe('generateIdempotencyKey', () => {
		it('should generate a valid UUID v4', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const key = (service as any).generateIdempotencyKey();
			expect(key).toMatch(idempotencyKeyRegex);
		});

		it('should return a new key on each call', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const key1 = (service as any).generateIdempotencyKey();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const key2 = (service as any).generateIdempotencyKey();
			expect(key1).not.toBe(key2);
		});

		it('should use Math.random fallback when crypto.randomUUID is unavailable', () => {
			const originalRandomUUID = crypto.randomUUID;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(crypto as any).randomUUID = undefined;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const key = (service as any).generateIdempotencyKey();
			expect(key).toMatch(idempotencyKeyRegex);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(crypto as any).randomUUID = originalRandomUUID;
		});
	});
});
