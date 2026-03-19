import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BlogService } from './blog-service';
import { BlogPost, BlogPageResponse, CreateBlogPost } from '@interfaces/blog-data';

const mockPost: BlogPost = {
	post_id: 'abc-123',
	title: 'Test Post',
	slug: 'test-post',
	sections: [{ type: 'markdown', content: '# Hello' }],
	excerpt: 'A test excerpt',
	author: 'Tester',
	published: true,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
};

describe('BlogService', () => {
	let service: BlogService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [BlogService, provideHttpClient(), provideHttpClientTesting()],
		});
		service = TestBed.inject(BlogService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('getPosts()', () => {
		it('should send correct default headers', () => {
			service.getPosts().subscribe();

			const req = httpMock.expectOne('/api/blog');
			expect(req.request.method).toBe('GET');
			expect(req.request.headers.get('BlogPost-Page')).toBe('0');
			expect(req.request.headers.get('BlogPost-Page-Size')).toBe('10');
			expect(req.request.headers.get('BlogPost-OnPublished')).toBe('false');
			expect(req.request.headers.get('BlogPost-Slug')).toBeNull();
			req.flush({ data: [], page: 0, page_size: 10, total_items: 0 });
		});

		it('should send custom page and pageSize headers', () => {
			service.getPosts(2, 5).subscribe();

			const req = httpMock.expectOne('/api/blog');
			expect(req.request.headers.get('BlogPost-Page')).toBe('2');
			expect(req.request.headers.get('BlogPost-Page-Size')).toBe('5');
			req.flush({ data: [], page: 2, page_size: 5, total_items: 0 });
		});

		it('should send the onPublished header when true', () => {
			service.getPosts(0, 10, true).subscribe();

			const req = httpMock.expectOne('/api/blog');
			expect(req.request.headers.get('BlogPost-OnPublished')).toBe('true');
			req.flush({ data: [] });
		});

		it('should include the slug header when a slug is provided', () => {
			service.getPosts(0, 10, false, 'my-post').subscribe();

			const req = httpMock.expectOne('/api/blog');
			expect(req.request.headers.get('BlogPost-Slug')).toBe('my-post');
			req.flush({ data: [mockPost], total_items: 1 });
		});

		it('should omit the slug header when no slug is provided', () => {
			service.getPosts(0, 10, false).subscribe();

			const req = httpMock.expectOne('/api/blog');
			expect(req.request.headers.get('BlogPost-Slug')).toBeNull();
			req.flush({ data: [] });
		});

		it('should map a full response to the BlogPageResponse shape', () => {
			let result: BlogPageResponse | undefined;
			service.getPosts(1, 5).subscribe((r) => (result = r));

			const req = httpMock.expectOne('/api/blog');
			req.flush({ data: [mockPost], page: 1, page_size: 5, total_items: 25 });

			expect(result).toEqual({
				data: [mockPost],
				pagination: {
					page: 1,
					page_size: 5,
					total_items: 25,
					total_pages: 5,
				},
			});
		});

		it('should normalize non-array data to an empty array', () => {
			let result: BlogPageResponse | undefined;
			service.getPosts().subscribe((r) => (result = r));

			const req = httpMock.expectOne('/api/blog');
			req.flush({ data: null, total_items: 0 });

			expect(result!.data).toEqual([]);
		});

		it('should use total_count when total_items is absent', () => {
			let result: BlogPageResponse | undefined;
			service.getPosts(0, 10).subscribe((r) => (result = r));

			const req = httpMock.expectOne('/api/blog');
			req.flush({ data: [mockPost], total_count: 42 });

			expect(result!.pagination.total_items).toBe(42);
		});

		it('should use total when both total_items and total_count are absent', () => {
			let result: BlogPageResponse | undefined;
			service.getPosts(0, 10).subscribe((r) => (result = r));

			const req = httpMock.expectOne('/api/blog');
			req.flush({ data: [mockPost], total: 7 });

			expect(result!.pagination.total_items).toBe(7);
		});

		it('should fall back to data.length when no total field is present', () => {
			let result: BlogPageResponse | undefined;
			service.getPosts(0, 10).subscribe((r) => (result = r));

			const req = httpMock.expectOne('/api/blog');
			req.flush({ data: [mockPost, mockPost] });

			expect(result!.pagination.total_items).toBe(2);
		});

		it('should correctly calculate total_pages', () => {
			let result: BlogPageResponse | undefined;
			service.getPosts(0, 10).subscribe((r) => (result = r));

			const req = httpMock.expectOne('/api/blog');
			req.flush({ data: [], total_items: 23, page_size: 10 });

			expect(result!.pagination.total_pages).toBe(3);
		});

		it('should fall back to page parameter when response page is missing', () => {
			let result: BlogPageResponse | undefined;
			service.getPosts(3, 10).subscribe((r) => (result = r));

			const req = httpMock.expectOne('/api/blog');
			req.flush({ data: [], total_items: 0 });

			expect(result!.pagination.page).toBe(3);
		});
	});

	describe('createPost()', () => {
		it('should POST to the correct URL with the post body', () => {
			const newPost: CreateBlogPost = {
				title: 'New Post',
				sections: [{ type: 'markdown', content: 'content' }],
				excerpt: 'excerpt',
				author: 'Author',
			};

			service.createPost(newPost).subscribe();

			const req = httpMock.expectOne('/api/admin/blog/post');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(newPost);
			expect(req.request.withCredentials).toBe(true);
			expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
			req.flush(null);
		});
	});

	describe('publishPost()', () => {
		it('should PATCH to the correct URL with post_id and published flag', () => {
			service.publishPost('post-id-1', true).subscribe();

			const req = httpMock.expectOne('/api/admin/blog/publish');
			expect(req.request.method).toBe('PATCH');
			expect(req.request.body).toEqual({ post_id: 'post-id-1', published: true });
			expect(req.request.withCredentials).toBe(true);
			expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
			req.flush(null);
		});

		it('should send published: false when unpublishing', () => {
			service.publishPost('post-id-1', false).subscribe();

			const req = httpMock.expectOne('/api/admin/blog/publish');
			expect(req.request.body).toEqual({ post_id: 'post-id-1', published: false });
			req.flush(null);
		});
	});

	describe('editPost()', () => {
		it('should PATCH to the correct URL with post_id and edits spread into the body', () => {
			service
				.editPost('post-id-1', { title: 'Updated Title', excerpt: 'new excerpt' })
				.subscribe();

			const req = httpMock.expectOne('/api/admin/blog/edit');
			expect(req.request.method).toBe('PATCH');
			expect(req.request.body).toEqual({
				post_id: 'post-id-1',
				title: 'Updated Title',
				excerpt: 'new excerpt',
			});
			expect(req.request.withCredentials).toBe(true);
			expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
			req.flush(null);
		});
	});

	describe('deletePost()', () => {
		it('should DELETE to the correct URL with post_id in the body', () => {
			service.deletePost('post-id-1').subscribe();

			const req = httpMock.expectOne('/api/admin/blog/delete');
			expect(req.request.method).toBe('DELETE');
			expect(req.request.body).toEqual({ post_id: 'post-id-1' });
			expect(req.request.withCredentials).toBe(true);
			expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
			req.flush(null);
		});
	});
});
