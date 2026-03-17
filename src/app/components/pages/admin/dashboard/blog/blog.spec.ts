import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Blog } from './blog';
import { BlogService } from '@services/blog/blog-service';
import { BlogPost, BlogPageResponse, CarouselImage } from '@interfaces/blog-data';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';

function mockPost(overrides: Partial<BlogPost> = {}): BlogPost {
	return {
		post_id: 'post-1',
		title: 'Test Post',
		slug: 'test-post',
		excerpt: 'This is a test post.',
		sections: [{ type: 'markdown', content: 'Hello world' }],
		author: 'Albert Author',
		published: false,
		created_at: '2026-03-17T00:00:00Z',
		updated_at: '2026-03-17T00:00:00Z',
		...overrides,
	};
}

function mockPageResponse(posts: BlogPost[], totalPages = 1): BlogPageResponse {
	return {
		data: posts,
		pagination: {
			page: 0,
			page_size: 20,
			total_items: posts.length,
			total_pages: totalPages,
		},
	};
}

describe('Blog', () => {
	let component: Blog;
	let fixture: ComponentFixture<Blog>;
	let mockBlogService: {
		getPosts: ReturnType<typeof vi.fn>;
		createPost: ReturnType<typeof vi.fn>;
		editPost: ReturnType<typeof vi.fn>;
		publishPost: ReturnType<typeof vi.fn>;
		deletePost: ReturnType<typeof vi.fn>;
	};

	beforeEach(async () => {
		mockBlogService = {
			getPosts: vi.fn().mockReturnValue(of(mockPageResponse([]))),
			createPost: vi.fn().mockReturnValue(of(undefined)),
			editPost: vi.fn().mockReturnValue(of(undefined)),
			publishPost: vi.fn().mockReturnValue(of(undefined)),
			deletePost: vi.fn().mockReturnValue(of(undefined)),
		};

		await TestBed.configureTestingModule({
			imports: [Blog],
			providers: [
				importProvidersFrom(FeatherModule.pick(allIcons)),
				{ provide: BlogService, useValue: mockBlogService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Blog);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('initialization', () => {
		it('should call loadPosts on init', () => {
			const spy = vi.spyOn(component, 'loadPosts');
			component.ngOnInit();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('loadPosts', () => {
		it('should set posts and totalPages on success', () => {
			const post = mockPost();
			mockBlogService.getPosts.mockReturnValue(of(mockPageResponse([post], 3)));
			component.loadPosts();
			expect(component.posts()).toEqual([post]);
			expect(component.totalPages()).toBe(3);
			expect(component.loadingPosts()).toBe(false);
		});

		it('should request published=false (admin view)', () => {
			component.loadPosts();
			expect(mockBlogService.getPosts).toHaveBeenCalledWith(
				expect.any(Number),
				expect.any(Number),
				false,
			);
		});

		it('should pass currentPage and pageSize to getPosts', () => {
			component.currentPage.set(2);
			component.pageSize.set(10);
			component.loadPosts();
			expect(mockBlogService.getPosts).toHaveBeenCalledWith(2, 10, false);
		});

		it('should set loadingPosts to true while the request is in-flight', () => {
			const subject = new Subject<BlogPageResponse>();
			mockBlogService.getPosts.mockReturnValue(subject.asObservable());
			component.loadPosts();
			expect(component.loadingPosts()).toBe(true);
			subject.next(mockPageResponse([]));
			subject.complete();
			expect(component.loadingPosts()).toBe(false);
		});

		it('should clear listError on success', () => {
			component.listError.set('previous error');
			mockBlogService.getPosts.mockReturnValue(of(mockPageResponse([])));
			component.loadPosts();
			expect(component.listError()).toBeNull();
		});

		it('should set listError on failure', () => {
			mockBlogService.getPosts.mockReturnValue(
				throwError(() => ({ message: 'Network error' })),
			);
			component.loadPosts();
			expect(component.listError()).toBe('Failed to load posts: Network error');
			expect(component.loadingPosts()).toBe(false);
		});

		it('should include error.error.error detail in listError when available', () => {
			mockBlogService.getPosts.mockReturnValue(
				throwError(() => ({ error: { error: 'Unauthorized' } })),
			);
			component.loadPosts();
			expect(component.listError()).toContain('Unauthorized');
		});
	});

	describe('prevPage', () => {
		it('should decrement currentPage and reload posts', () => {
			component.currentPage.set(2);
			component.totalPages.set(5);
			const spy = vi.spyOn(component, 'loadPosts');
			component.prevPage();
			expect(component.currentPage()).toBe(1);
			expect(spy).toHaveBeenCalled();
		});

		it('should not go below page 0', () => {
			component.currentPage.set(0);
			const spy = vi.spyOn(component, 'loadPosts');
			component.prevPage();
			expect(component.currentPage()).toBe(0);
			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('nextPage', () => {
		it('should increment currentPage and reload posts', () => {
			component.currentPage.set(0);
			component.totalPages.set(3);
			const spy = vi.spyOn(component, 'loadPosts');
			component.nextPage();
			expect(component.currentPage()).toBe(1);
			expect(spy).toHaveBeenCalled();
		});

		it('should not go beyond the last page', () => {
			component.currentPage.set(2);
			component.totalPages.set(3);
			const spy = vi.spyOn(component, 'loadPosts');
			component.nextPage();
			expect(component.currentPage()).toBe(2);
			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('selectedPost', () => {
		it('should set selectedPost to the clicked post', () => {
			const post = mockPost();
			component.selectPost(post);
			expect(component.selectedPost()).toEqual(post);
		});

		it('should populate all form fields from the post', () => {
			const post = mockPost();
			component.selectPost(post);
			expect(component.formTitle()).toBe(post.title);
			expect(component.formSlug()).toBe(post.slug);
			expect(component.formExcerpt()).toBe(post.excerpt);
			expect(component.formAuthor()).toBe(post.author);
		});

		it('should set editorMode to "edit"', () => {
			component.selectPost(mockPost());
			expect(component.editorMode()).toBe('edit');
		});

		it('should convert sections back to raw content in the form', () => {
			const post = mockPost({ sections: [{ type: 'markdown', content: '# Hello' }] });
			component.selectPost(post);
			expect(component.formRawContent()).toBe('# Hello');
		});

		it('should convert carousel sections back to raw syntax', () => {
			const post = mockPost({
				sections: [
					{
						type: 'carousel',
						label: 'Gallery',
						slides: [{ src: 'image.jpg', alt: 'Alt', caption: 'Caption' }],
					},
				],
			});

			component.selectPost(post);
			expect(component.formRawContent()).toContain('---carousel-start Gallery---');
			expect(component.formRawContent()).toContain('image.jpg | Alt | Caption');
			expect(component.formRawContent()).toContain('---carousel-end---');
		});

		it('should call clearMessages', () => {
			const spy = vi.spyOn(component, 'clearMessages');
			component.selectPost(mockPost());
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('newPost', () => {
		it('should clear selectedPost', () => {
			component.selectedPost.set(mockPost());
			component.newPost();
			expect(component.selectedPost()).toBeNull();
		});

		it('should reset all form fields to empty strings', () => {
			component.formTitle.set('Some title');
			component.formSlug.set('some-slug');
			component.formExcerpt.set('Some excerpt');
			component.formAuthor.set('Some author');
			component.formRawContent.set('Some content');
			component.newPost();
			expect(component.formTitle()).toBe('');
			expect(component.formSlug()).toBe('');
			expect(component.formExcerpt()).toBe('');
			expect(component.formAuthor()).toBe('');
			expect(component.formRawContent()).toBe('');
		});

		it('should set editorMode to "create"', () => {
			component.editorMode.set('preview');
			component.newPost();
			expect(component.editorMode()).toBe('create');
		});

		it('should call clearMessages', () => {
			const spy = vi.spyOn(component, 'clearMessages');
			component.newPost();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('isEditing', () => {
		it('should return false when no post is selected', () => {
			component.selectedPost.set(null);
			expect(component.isEditing()).toBe(false);
		});

		it('should return true when a post is selected', () => {
			component.selectedPost.set(mockPost());
			expect(component.isEditing()).toBe(true);
		});
	});

	describe('autoSlug', () => {
		// oops! autoSlug doesn't strip punctuation
		it('should generate a slug from the title in create mode', () => {
			component.editorMode.set('create');
			component.formTitle.set('My New Blog Post');
			component.autoSlug();
			expect(component.formSlug()).toBe('my-new-blog-post');
		});

		it('should collapse multiple spaces into a single hyphen', () => {
			component.editorMode.set('create');
			component.formTitle.set('My    New    Blog    Post');
			component.autoSlug();
			expect(component.formSlug()).toBe('my-new-blog-post');
		});

		it('should trim leading/trailing whitespace', () => {
			component.editorMode.set('create');
			component.formTitle.set('   My New Blog Post   ');
			component.autoSlug();
			expect(component.formSlug()).toBe('my-new-blog-post');
		});

		it('should not modify the slug in edit mode', () => {
			component.editorMode.set('edit');
			component.formSlug.set('existing-slug');
			component.formTitle.set('My New Blog Post');
			component.autoSlug();
			expect(component.formSlug()).toBe('existing-slug');
		});

		it('should not modify the slug in preview mode', () => {
			component.editorMode.set('preview');
			component.formSlug.set('existing-slug');
			component.formTitle.set('My New Blog Post');
			component.autoSlug();
			expect(component.formSlug()).toBe('existing-slug');
		});
	});

	describe('setMode', () => {
		it('should change editorMode to the supplied value', () => {
			component.setMode('preview');
			expect(component.editorMode()).toBe('preview');
			component.setMode('edit');
			expect(component.editorMode()).toBe('edit');
			component.setMode('create');
			expect(component.editorMode()).toBe('create');
			// should allow invalid modes too, careful with this
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			component.setMode('invalid-mode' as any);
			expect(component.editorMode()).toBe('invalid-mode');
		});
	});

	describe('parsedSections', () => {
		it('should return an empty array for empty content', () => {
			component.formRawContent.set('');
			expect(component.parsedSections()).toEqual([]);
		});

		it('should return a single markdown section for plain text', () => {
			component.formRawContent.set('# Hello\n\nSome text.');
			const sections = component.parsedSections();
			expect(sections).toHaveLength(1);
			expect(sections[0].type).toBe('markdown');
			expect((sections[0] as { content: string }).content).toBe('# Hello\n\nSome text.');
		});

		it('should parse a carousel section without a label', () => {
			const raw = `---carousel-start---\nimage1.jpg | Alt 1 | Caption 1\n---carousel-end---`;
			component.formRawContent.set(raw);
			const sections = component.parsedSections();
			expect(sections).toHaveLength(1);
			expect(sections[0].type).toBe('carousel');
			expect(sections[0].label).toBeUndefined();
		});

		it('should parse a carousel section with a label', () => {
			const raw = `---carousel-start Gallery---\nimage1.jpg | Alt 1 | Caption 1\n---carousel-end---`;
			component.formRawContent.set(raw);
			const sections = component.parsedSections();
			expect(sections).toHaveLength(1);
			expect(sections[0].type).toBe('carousel');
			expect(sections[0].label).toBe('Gallery');
		});

		it('should correctly parse slide src, alt, and caption', () => {
			const raw = `---carousel-start---\nimage1.jpg | Alt 1 | Caption 1\n---carousel-end---`;
			component.formRawContent.set(raw);
			const sections = component.parsedSections();
			const slides = (sections[0] as { slides: CarouselImage[] }).slides;
			expect(slides[0]).toEqual({ src: 'image1.jpg', alt: 'Alt 1', caption: 'Caption 1' });
		});

		it('should parse multiple slides', () => {
			const raw = `---carousel-start---\nimage1.jpg | Alt 1 | Caption 1\nimage2.jpg | Alt 2 | Caption 2\n---carousel-end---`;
			component.formRawContent.set(raw);
			const sections = component.parsedSections();
			const slides = (sections[0] as { slides: CarouselImage[] }).slides;
			expect(slides).toEqual([
				{ src: 'image1.jpg', alt: 'Alt 1', caption: 'Caption 1' },
				{ src: 'image2.jpg', alt: 'Alt 2', caption: 'Caption 2' },
			]);
		});

		it('should filter out slides with no src', () => {
			const raw = `---carousel-start---\n | Alt 1 | Caption 1\nimage2.jpg | Alt 2 | Caption 2\n---carousel-end---`;
			component.formRawContent.set(raw);
			const slides = (component.parsedSections()[0] as { slides: CarouselImage[] }).slides;
			expect(slides).toHaveLength(1);
			expect(slides[0]).toEqual({ src: 'image2.jpg', alt: 'Alt 2', caption: 'Caption 2' });
		});

		it('should omit a carousel entirely if it has no valid slides', () => {
			const raw = `---carousel-start---\n | Alt 1\n---carousel-end---`;
			component.formRawContent.set(raw);
			expect(component.parsedSections()).toHaveLength(0);
		});

		it('should handle mixed markdown and carousel contnet', () => {
			const raw = [
				'Intro paragraph',
				'',
				'---carousel-start---',
				'image1.jpg | Alt 1 | Caption 1',
				'image2.jpg | Alt 2 | Caption 2',
				'---carousel-end---',
				'',
				'Outro paragraph',
			].join('\n');
			component.formRawContent.set(raw);
			const sections = component.parsedSections();
			expect(sections.some((s) => s.type === 'markdown')).toBe(true);
			expect(sections.some((s) => s.type === 'carousel')).toBe(true);
		});

		it('should treat an unclosed carousel block as markdown', () => {
			const raw = `---carousel-start---\nimage1.jpg | Alt 1 | Caption 1\n`;
			component.formRawContent.set(raw);
			const sections = component.parsedSections();
			expect(sections.every((s) => s.type === 'markdown')).toBe(true);
		});

		it('should flush buffered markdown before a carousel block', () => {
			const raw = `Before content\n---carousel-start---\nimage1.jpg | Alt 1 | Caption 1\n---carousel-end---`;
			component.formRawContent.set(raw);
			const sections = component.parsedSections();
			expect(sections[0].type).toBe('markdown');
			expect(sections[1].type).toBe('carousel');
		});

		it('should ignore blank lines inside a carousel block', () => {
			const raw = `---carousel-start---\n\nimage1.jpg | Alt 1 | Caption 1\n\n---carousel-end---`;
			component.formRawContent.set(raw);
			const slides = (component.parsedSections()[0] as { slides: CarouselImage[] }).slides;
			expect(slides).toHaveLength(1);
		});
	});

	describe('dirtyFields', () => {
		it('should return null when not editing', () => {
			component.selectedPost.set(null);
			expect(component.dirtyFields()).toBeNull();
		});

		it('should return an empty object when no fields have changed', () => {
			component.selectPost(mockPost());
			expect(component.dirtyFields()).toEqual({});
		});

		it('should mark title as dirty when changed', () => {
			component.selectPost(mockPost());
			component.formTitle.set('Changed title');
			expect(component.dirtyFields()?.['title']).toBe(true);
		});

		it('should mark excerpt as dirty when changed', () => {
			component.selectPost(mockPost());
			component.formExcerpt.set('Changed excerpt');
			expect(component.dirtyFields()?.['excerpt']).toBe(true);
		});

		it('should mark author as dirty when changed', () => {
			component.selectPost(mockPost());
			component.formAuthor.set('Changed author');
			expect(component.dirtyFields()?.['author']).toBe(true);
		});

		it('should mark rawContent as dirty when changed', () => {
			component.selectPost(mockPost());
			component.formRawContent.set('Changed raw content');
			expect(component.dirtyFields()?.['rawContent']).toBe(true);
		});

		it('should not include unchanged fields', () => {
			const post = mockPost();
			component.selectPost(post);
			component.formTitle.set('Changed title');
			const dirty = component.dirtyFields();
			expect(dirty?.['title']).toBe(true);
			expect(dirty?.['excerpt']).toBeUndefined();
			expect(dirty?.['author']).toBeUndefined();
			expect(dirty?.['rawContent']).toBeUndefined();
		});
	});

	describe('hasDirtyFields', () => {
		it('should be false when no post is selected', () => {
			component.selectedPost.set(null);
			expect(component.hasDirtyFields()).toBe(false);
		});

		it('should be false when no fields have changed', () => {
			component.selectPost(mockPost());
			expect(component.hasDirtyFields()).toBe(false);
		});

		it('should be true when at least one field has changed', () => {
			component.selectPost(mockPost());
			component.formTitle.set('Changed title');
			expect(component.hasDirtyFields()).toBe(true);
		});
	});

	describe('savePost (create mode)', () => {
		beforeEach(() => {
			component.newPost();
			component.formTitle.set('New Post');
			component.formExcerpt.set('Some excerpt');
			component.formAuthor.set('Author Name');
			component.formRawContent.set('# Raw content here');
		});

		it('should call blogService.createPost with the correct payload', () => {
			component.savePost();
			expect(mockBlogService.createPost).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'New Post',
					excerpt: 'Some excerpt',
					author: 'Author Name',
					sections: [{ type: 'markdown', content: '# Raw content here' }],
				}),
			);
		});

		it('should reset the form and reload posts on success', () => {
			component.savePost();
			expect(component.formTitle()).toBe('');
			expect(component.formRawContent()).toBe('');
			expect(mockBlogService.getPosts).toHaveBeenCalled();
		});

		it('should show a success message containing post title', () => {
			component.savePost();
			expect(component.editorSuccess()).toContain('New Post');
		});

		it('should set saving to false on success', () => {
			component.savePost();
			expect(component.saving()).toBe(false);
		});

		it('should set editorError on failure', () => {
			mockBlogService.createPost.mockReturnValue(
				throwError(() => ({ message: 'Server error' })),
			);
			component.savePost();
			expect(component.editorError()).toContain('Server error');
		});

		it('should include error.error.error in the error message when available', () => {
			mockBlogService.createPost.mockReturnValue(
				throwError(() => ({ error: { error: 'Validation failed' } })),
			);
			component.savePost();
			expect(component.editorError()).toContain('Validation failed');
		});

		it('should set saving to false on failure', () => {
			mockBlogService.createPost.mockReturnValue(throwError(() => ({})));
			component.savePost();
			expect(component.saving()).toBe(false);
		});
	});

	describe('savePost (edit mode)', () => {
		let post: BlogPost;

		beforeEach(() => {
			post = mockPost();
			component.selectPost(post);
		});

		it('should do nothing when no fields are dirty', () => {
			component.savePost();
			expect(mockBlogService.editPost).not.toHaveBeenCalled();
		});

		it('should call blogService.editPost with the post_id', () => {
			component.formTitle.set('Changed title');
			component.savePost();
			expect(mockBlogService.editPost).toHaveBeenCalledWith(
				post.post_id,
				expect.objectContaining({
					post_id: post.post_id,
				}),
			);
		});

		it('should include only dirty fields in the payload', () => {
			component.formTitle.set('Changed title');
			component.savePost();
			const payload = mockBlogService.editPost.mock.calls[0][1];
			expect(payload.title).toBe('Changed title');
			expect(payload.excerpt).toBeUndefined();
			expect(payload.author).toBeUndefined();
		});

		it('should send sections when content is dirty', () => {
			component.formRawContent.set('Changed content');
			component.savePost();
			const payload = mockBlogService.editPost.mock.calls[0][1];
			expect(payload.sections).toEqual([{ type: 'markdown', content: 'Changed content' }]);
			expect(payload.rawContent).toBeUndefined();
			expect(payload.title).toBeUndefined();
		});

		it('should update selectedPost on success', () => {
			component.formTitle.set('Changed title');
			component.savePost();
			expect(component.selectedPost()?.title).toBe('Changed title');
		});

		it('should update the post in the posts list on success', () => {
			component.posts.set([post]);
			component.formTitle.set('Changed title');
			component.savePost();
			expect(component.posts()[0].title).toBe('Changed title');

			const otherPost = mockPost({ post_id: 'post-2', title: 'Other Post' });
			component.posts.set([otherPost, post]);
			component.formTitle.set('Changed title again');
			component.savePost();
			expect(component.posts().find((p) => p.post_id === 'post-2')?.title).toBe('Other Post');
			expect(component.posts().find((p) => p.post_id === post.post_id)?.title).toBe(
				'Changed title again',
			);
		});

		it('should show a success message with the updated title', () => {
			component.formTitle.set('Updated Title');
			component.savePost();
			expect(component.editorSuccess()).toContain('Updated Title');
		});

		it('should set saving to false on success', () => {
			component.formTitle.set('Changed title');
			component.savePost();
			expect(component.saving()).toBe(false);
		});

		it('should set editorError on failure', () => {
			component.formTitle.set('Changed title');
			mockBlogService.editPost.mockReturnValue(
				throwError(() => ({ message: 'Server error' })),
			);
			component.savePost();
			expect(component.editorError()).toContain('Server error');
		});

		it('should set saving to false on failure', () => {
			component.formTitle.set('Changed title');
			mockBlogService.editPost.mockReturnValue(throwError(() => ({})));
			component.savePost();
			expect(component.saving()).toBe(false);
		});
	});

	describe('togglePublish', () => {
		it('should do nothing when no post is selected', () => {
			component.selectedPost.set(null);
			component.togglePublish();
			expect(mockBlogService.publishPost).not.toHaveBeenCalled();
		});

		it('should call publishPost with true when the post is currently unpublished', () => {
			component.selectPost(mockPost({ published: false }));
			component.togglePublish();
			expect(mockBlogService.publishPost).toHaveBeenCalledWith('post-1', true);
		});

		it('should call publishPost with false when the post is currently published', () => {
			component.selectPost(mockPost({ published: true }));
			component.togglePublish();
			expect(mockBlogService.publishPost).toHaveBeenCalledWith('post-1', false);
		});

		it('should update the post in the list on success', () => {
			const post = mockPost({ published: false });
			component.posts.set([post]);
			component.selectPost(post);
			component.togglePublish();
			expect(component.posts()[0].published).toBe(true);
		});

		it('should show a success message on publish', () => {
			component.selectPost(mockPost({ published: false }));
			component.togglePublish();
			expect(component.editorSuccess()).toContain('published');
		});

		it('should show a success message on unpublish', () => {
			component.selectPost(mockPost({ published: true }));
			component.togglePublish();
			expect(component.editorSuccess()).toContain('unpublished');
		});

		it('should set editorError on failure', () => {
			mockBlogService.publishPost.mockReturnValue(throwError(() => ({})));
			component.selectedPost.set(mockPost());
			component.togglePublish();
			expect(component.editorError()).toContain('Failed to update publish status');
		});

		it('hould set saving to false on failure', () => {
			mockBlogService.publishPost.mockReturnValue(throwError(() => ({})));
			component.selectedPost.set(mockPost());
			component.togglePublish();
			expect(component.saving()).toBe(false);
		});
	});

	describe('deletePost', () => {
		it('should do nothing when no post is selected', () => {
			component.selectedPost.set(null);
			component.deletePost();
			expect(mockBlogService.deletePost).not.toHaveBeenCalled();
		});

		it('should do nothing when the user cancels the confirmation dialog', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(false);
			component.selectedPost.set(mockPost());
			component.deletePost();
			expect(mockBlogService.deletePost).not.toHaveBeenCalled();
		});

		it('should call blogService.deletePost with the post_id on confirmation', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			const post = mockPost();
			component.selectedPost.set(post);
			component.deletePost();
			expect(mockBlogService.deletePost).toHaveBeenCalledWith(post.post_id);
		});

		it('should remove the post from the list on success', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			const post = mockPost();
			component.posts.set([post]);
			component.selectedPost.set(post);
			component.deletePost();
			expect(component.posts()).toHaveLength(0);
		});

		it('should not remove other posts from the list', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			const post1 = mockPost();
			const post2 = mockPost({ post_id: 'post-2' });
			component.posts.set([post1, post2]);
			component.selectedPost.set(post1);
			component.deletePost();
			expect(component.posts()).toEqual([post2]);
		});

		it('should reset the editor to create mode on success', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			const post = mockPost();
			component.selectedPost.set(post);
			component.deletePost();
			expect(component.editorMode()).toBe('create');
			expect(component.selectedPost()).toBeNull();
		});

		it('should set deleting to false on success', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			component.selectedPost.set(mockPost());
			component.deletePost();
			expect(component.deleting()).toBe(false);
		});

		it('should show a success message containing the post title', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			component.selectedPost.set(mockPost({ title: 'Post to Delete' }));
			component.deletePost();
			expect(component.editorSuccess()).toContain('Post to Delete');
			expect(component.editorSuccess()).toContain('deleted');
		});

		it('should set editorError on failure', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			mockBlogService.deletePost.mockReturnValue(throwError(() => ({})));
			component.selectedPost.set(mockPost());
			component.deletePost();
			expect(component.editorError()).toContain('Failed to delete post.');
		});

		it('should set deleting to false on failure', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			mockBlogService.deletePost.mockReturnValue(throwError(() => ({})));
			component.selectedPost.set(mockPost());
			component.deletePost();
			expect(component.deleting()).toBe(false);
		});
	});

	describe('setSuccess', () => {
		it('should set editorSuccess to the provided message', () => {
			component.setSuccess('All good');
			expect(component.editorSuccess()).toBe('All good');
		});

		it('should auto-clear editorSuccess after the given duration', () => {
			vi.useFakeTimers();
			component.setSuccess('Temp success', 200);
			vi.advanceTimersByTime(200);
			expect(component.editorSuccess()).toBeNull();
			vi.useRealTimers();
		});

		it('should reset the timer when called a second time before it fires', () => {
			vi.useFakeTimers();
			component.setSuccess('First message', 500);
			component.setSuccess('Second message', 1000);
			vi.advanceTimersByTime(500);
			expect(component.editorSuccess()).toBe('Second message');
			vi.advanceTimersByTime(500);
			expect(component.editorSuccess()).toBeNull();
			vi.useRealTimers();
		});
	});

	describe('setError', () => {
		it('should set editorError to the provided message', () => {
			component.setError('Something went wrong');
			expect(component.editorError()).toBe('Something went wrong');
		});

		it('should auto-clear editorError after the given duration', () => {
			vi.useFakeTimers();
			component.setError('Temp error', 300);
			vi.advanceTimersByTime(300);
			expect(component.editorError()).toBeNull();
			vi.useRealTimers();
		});

		it('should reset the timer when called a second time before it fires', () => {
			vi.useFakeTimers();
			component.setError('First error', 400);
			component.setError('Second error', 800);
			vi.advanceTimersByTime(400);
			expect(component.editorError()).toBe('Second error');
			vi.advanceTimersByTime(400);
			expect(component.editorError()).toBeNull();
			vi.useRealTimers();
		});
	});

	describe('clearMessages', () => {
		it('should immediately clear both success and error messages', () => {
			component.editorSuccess.set('Success message');
			component.editorError.set('Error message');
			component.clearMessages();
			expect(component.editorSuccess()).toBeNull();
			expect(component.editorError()).toBeNull();
		});

		it('should cancel pending auto-clear timers', () => {
			vi.useFakeTimers();
			component.setSuccess('will be cleared', 500);
			component.clearMessages();
			vi.advanceTimersByTime(500);
			expect(component.editorSuccess()).toBeNull();
			vi.useRealTimers();
		});
	});

	describe('formatDate', () => {
		it('should format ISO date strings into a human-readable format', () => {
			const result = component.formatDate('2026-03-17T14:30:00Z');
			expect(result).toMatch(/Mar/);
			expect(result).toMatch(/17/);
			expect(result).toMatch(/2026/);
		});
	});

	describe('modal', () => {
		it('should delegate openModal to splitModal.openModal', () => {
			const spy = vi.spyOn(component.splitModal, 'openModal');
			component.openSplitModal();
			expect(spy).toHaveBeenCalled();
		});

		it('should delegate closeModal to splitModal.closeModal', () => {
			const spy = vi.spyOn(component.splitModal, 'closeModal');
			component.closeSplitModal();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('ngOnDestroy', () => {
		it('should close the split modal on destroy', () => {
			const spy = vi.spyOn(component.splitModal, 'closeModal');
			component.ngOnDestroy();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('template', () => {
		describe('post list panel', () => {
			it('should show the loading indicator when loadingPosts is true', () => {
				component.loadingPosts.set(true);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.list-loading')).toBeTruthy();
			});

			it('should hide the loading indicator when loadingPosts is false', () => {
				component.loadingPosts.set(false);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.list-loading')).toBeFalsy();
			});

			it('should render the list error when listError is set', () => {
				component.listError.set('Failed to load');
				fixture.detectChanges();
				const errorElement = fixture.nativeElement.querySelector(
					'.notification.is-danger.is-small',
				);
				expect(errorElement).toBeTruthy();
				expect(errorElement.textContent).toContain('Failed to load');
			});

			it('should remove the list error when listError is cleared', () => {
				component.listError.set(null);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.notification.is-danger.is-small'),
				).toBeFalsy();
			});

			it('should show the empty-state message when there are no posts, no loading, and no error', () => {
				component.posts.set([]);
				component.loadingPosts.set(false);
				component.listError.set(null);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.list-empty')).toBeTruthy();
			});

			it('should suppress the empty-state message while loading', () => {
				component.posts.set([]);
				component.loadingPosts.set(true);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.list-empty')).toBeFalsy();
			});

			it('should suppress the empty-state message when there is an error', () => {
				component.posts.set([]);
				component.loadingPosts.set(false);
				component.listError.set('Failed to load');
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.list-empty')).toBeFalsy();
			});

			it('should render one list item per post', () => {
				component.posts.set([
					mockPost({ post_id: 'post-1' }),
					mockPost({ post_id: 'post-2' }),
				]);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelectorAll('.post-list-item')).toHaveLength(2);
			});

			it('should display each post title inside its list item', () => {
				component.posts.set([mockPost({ title: 'mock post' })]);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.post-list-item').textContent,
				).toContain('mock post');
			});

			it('should apply is-selected to the currently selected post', () => {
				const post = mockPost({ post_id: 'post-1' });
				component.posts.set([post]);
				component.selectedPost.set(post);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.post-list-item').classList).toContain(
					'is-selected',
				);
			});

			it('should not apply is-selected to non-selected posts', () => {
				const post1 = mockPost({ post_id: 'post-1' });
				const post2 = mockPost({ post_id: 'post-2' });
				component.posts.set([post1, post2]);
				component.selectedPost.set(post1);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelectorAll('.post-list-item')[0].classList,
				).toContain('is-selected');
				expect(
					fixture.nativeElement.querySelectorAll('.post-list-item')[1].classList,
				).not.toContain('is-selected');
			});

			it('should apply is-published to the status dot of a published post', () => {
				component.posts.set([mockPost({ published: true })]);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.post-status-dot').classList).toContain(
					'is-published',
				);
			});

			it('should not apply is-published to the status dot of an unpublished post', () => {
				component.posts.set([mockPost({ published: false })]);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.post-status-dot').classList,
				).not.toContain('is-published');
			});

			it('should call selectPost when a list item is clicked', () => {
				const post = mockPost();
				component.posts.set([post]);
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'selectPost');
				fixture.nativeElement.querySelector('.post-list-item').click();
				expect(spy).toHaveBeenCalledWith(post);
			});

			it('should call selectPost when Enter is pressed on a list item', () => {
				const post = mockPost();
				component.posts.set([post]);
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'selectPost');
				fixture.debugElement
					.query(By.css('.post-list-item'))
					.triggerEventHandler('keypress.enter', {});
				expect(spy).toHaveBeenCalledWith(post);
			});

			it('should call newPost when the New button is clicked', () => {
				const spy = vi.spyOn(component, 'newPost');
				fixture.nativeElement.querySelector('.panel-header .pill-button').click();
				expect(spy).toHaveBeenCalled();
			});

			it('should not render pagination when total pages is 1', () => {
				component.totalPages.set(1);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.list-pagination')).toBeFalsy();
			});

			it('should render pagination when total pages is greater than 1', () => {
				component.totalPages.set(3);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.list-pagination')).toBeTruthy();
				expect(
					fixture.nativeElement.querySelectorAll('.list-pagination button'),
				).toHaveLength(2);
			});

			it('should display the correct current page and total pages in pagination', () => {
				component.currentPage.set(1);
				component.totalPages.set(4);
				fixture.detectChanges();
				const span = fixture.nativeElement.querySelector('.list-pagination span');
				expect(span).toBeTruthy();
				expect(span.textContent).toContain('2 / 4');
			});

			it('should disable prev button on the first page', () => {
				component.currentPage.set(0);
				component.totalPages.set(3);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.list-pagination button:first-child')
						.disabled,
				).toBe(true);
			});

			it('should enable the prev button when not on the first page', () => {
				component.currentPage.set(1);
				component.totalPages.set(3);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.list-pagination button:first-child')
						.disabled,
				).toBe(false);
			});

			it('should disable next button on the last page', () => {
				component.currentPage.set(2);
				component.totalPages.set(3);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.list-pagination button:last-child')
						.disabled,
				).toBe(true);
			});

			it('should enable the next button when not on the last page', () => {
				component.currentPage.set(1);
				component.totalPages.set(3);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.list-pagination button:last-child')
						.disabled,
				).toBe(false);
			});

			it('should call prevPage when the prev button is clicked', () => {
				component.currentPage.set(1);
				component.totalPages.set(3);
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'prevPage');
				fixture.nativeElement.querySelector('.list-pagination button:first-child').click();
				expect(spy).toHaveBeenCalled();
			});

			it('should call nextPage when the next button is clicked', () => {
				component.currentPage.set(1);
				component.totalPages.set(3);
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'nextPage');
				fixture.nativeElement.querySelector('.list-pagination button:last-child').click();
				expect(spy).toHaveBeenCalled();
			});
		});

		describe('editor header', () => {
			it('should mark the Write tab as active in create mode', () => {
				component.editorMode.set('create');
				fixture.detectChanges();
				const [writeTab] = fixture.nativeElement.querySelectorAll('.editor-tab');
				expect(writeTab.classList).toContain('is-active');
			});

			it('should mark the Write tab as active in edit mode', () => {
				component.editorMode.set('edit');
				fixture.detectChanges();
				const [writeTab] = fixture.nativeElement.querySelectorAll('.editor-tab');
				expect(writeTab.classList).toContain('is-active');
			});

			it('should not mark the Write tab as active in preview mode', () => {
				component.editorMode.set('preview');
				fixture.detectChanges();
				const [writeTab] = fixture.nativeElement.querySelectorAll('.editor-tab');
				expect(writeTab.classList).not.toContain('is-active');
			});

			it('should mark the Preview tab as active in preview mode', () => {
				component.editorMode.set('preview');
				fixture.detectChanges();
				const [, previewTab] = fixture.nativeElement.querySelectorAll('.editor-tab');
				expect(previewTab.classList).toContain('is-active');
			});

			it('should not mark the Preview tab as active in write modes', () => {
				component.editorMode.set('create');
				fixture.detectChanges();
				const [, previewTab] = fixture.nativeElement.querySelectorAll('.editor-tab');
				expect(previewTab.classList).not.toContain('is-active');
			});

			it('should call setMode("create") when the Write tab is clicked while not editing', () => {
				component.selectedPost.set(null);
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'setMode');
				fixture.nativeElement.querySelectorAll('.editor-tab')[0].click();
				expect(spy).toHaveBeenCalledWith('create');
			});

			it('should call setMode("edit") when the Write tab is clicked while editing', () => {
				component.selectedPost.set(mockPost());
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'setMode');
				fixture.nativeElement.querySelectorAll('.editor-tab')[0].click();
				expect(spy).toHaveBeenCalledWith('edit');
			});

			it('should not render the publish badge, toggle, or delete buttons when not editing', () => {
				component.selectedPost.set(null);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .publish-badge'),
				).toBeFalsy();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-muted'),
				).toBeFalsy();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-danger'),
				).toBeFalsy();
			});

			it('should render the publish badge, toggle button, and delete button when editing', () => {
				component.selectedPost.set(mockPost());
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .publish-badge'),
				).toBeTruthy();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-muted'),
				).toBeTruthy();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-danger'),
				).toBeTruthy();
			});

			it('should display "Published" in the badge for a published post', () => {
				component.selectedPost.set(mockPost({ published: true }));
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .publish-badge')
						.textContent,
				).toContain('Published');
			});

			it('should display "Draft" in the badge for an unpublished post', () => {
				component.selectedPost.set(mockPost({ published: false }));
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .publish-badge')
						.textContent,
				).toContain('Draft');
			});

			it('should apply is-published to the badge for a published post', () => {
				component.selectedPost.set(mockPost({ published: true }));
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .publish-badge').classList,
				).toContain('is-published');
			});

			it('should not apply is-published to the badge for an unpublished post', () => {
				component.selectedPost.set(mockPost({ published: false }));
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .publish-badge').classList,
				).not.toContain('is-published');
			});

			it('should display "Unpublish" on the toggle button for a published post', () => {
				component.selectedPost.set(mockPost({ published: true }));
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-muted')
						.textContent,
				).toContain('Unpublish');
			});

			it('should display "Publish" on the toggle button for an unpublished post', () => {
				component.selectedPost.set(mockPost({ published: false }));
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-muted')
						.textContent,
				).toContain('Publish');
			});

			it('should disable the toggle button when saving', () => {
				component.selectedPost.set(mockPost());
				component.saving.set(true);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-muted')
						.disabled,
				).toBe(true);
			});

			it('should enable the toggle button when not saving', () => {
				component.selectedPost.set(mockPost());
				component.saving.set(false);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-muted')
						.disabled,
				).toBe(false);
			});

			it('should disable the delete button when deleting', () => {
				component.selectedPost.set(mockPost());
				component.deleting.set(true);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-danger')
						.disabled,
				).toBe(true);
			});

			it('should enable the delete button when not deleting', () => {
				component.selectedPost.set(mockPost());
				component.deleting.set(false);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-danger')
						.disabled,
				).toBe(false);
			});

			it('should display "Save" on the primary button when editing', () => {
				component.selectedPost.set(mockPost());
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-primary')
						.textContent,
				).toContain('Save');
			});

			it('should display "Create" on the primary button when not editing', () => {
				component.selectedPost.set(null);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-primary')
						.textContent,
				).toContain('Create');
			});

			it('should disable the primary button when saving', () => {
				component.selectedPost.set(mockPost());
				component.saving.set(true);
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-actions .pill-button.is-primary')
						.disabled,
				).toBe(true);
			});

			it('should call savePost when the primary button is clicked', () => {
				const spy = vi.spyOn(component, 'savePost');
				fixture.nativeElement
					.querySelector('.editor-actions .pill-button.is-primary')
					.click();
				expect(spy).toHaveBeenCalled();
			});

			it('should call togglePublish when the toggle button is clicked', () => {
				component.selectedPost.set(mockPost());
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'togglePublish');
				fixture.nativeElement
					.querySelector('.editor-actions .pill-button.is-muted')
					.click();
				expect(spy).toHaveBeenCalled();
			});

			it('should call deletePost when the delete button is clicked', () => {
				vi.spyOn(window, 'confirm').mockReturnValue(false);
				component.selectedPost.set(mockPost());
				fixture.detectChanges();
				const spy = vi.spyOn(component, 'deletePost');
				fixture.nativeElement
					.querySelector('.editor-actions .pill-button.is-danger')
					.click();
				expect(spy).toHaveBeenCalled();
			});

			it('should call openSplitModal when the split button is clicked', () => {
				const spy = vi.spyOn(component, 'openSplitModal');
				fixture.nativeElement.querySelector('.pill-button[title="Split"]').click();
				expect(spy).toHaveBeenCalled();
			});
		});

		describe('notifications', () => {
			it('should add is-visible to the success notification when editorSuccess is set', () => {
				component.editorSuccess.set('Saved!');
				fixture.detectChanges();
				const el = fixture.nativeElement.querySelector('.editor-notification.is-success');
				expect(el.classList).toContain('is-visible');
			});

			it('should remove is-visible from the success notification when editorSuccess is null', () => {
				component.editorSuccess.set(null);
				fixture.detectChanges();
				const el = fixture.nativeElement.querySelector('.editor-notification.is-success');
				expect(el.classList).not.toContain('is-visible');
			});

			it('should render the success message text', () => {
				component.editorSuccess.set('Post created successfully');
				fixture.detectChanges();
				const span = fixture.nativeElement.querySelector(
					'.editor-notification.is-success span',
				);
				expect(span.textContent).toContain('Post created successfully');
			});

			it('should clear editorSuccess when the dismiss button is clicked', () => {
				component.editorSuccess.set('Saved!');
				fixture.detectChanges();
				fixture.nativeElement
					.querySelector('.editor-notification.is-success .notification-close')
					.click();
				expect(component.editorSuccess()).toBeNull();
			});

			it('should add is-visible to the error notification when editorError is set', () => {
				component.editorError.set('Something went wrong');
				fixture.detectChanges();
				const el = fixture.nativeElement.querySelector('.editor-notification.is-danger');
				expect(el.classList).toContain('is-visible');
			});

			it('should remove is-visible from the error notification when editorError is null', () => {
				component.editorError.set(null);
				fixture.detectChanges();
				const el = fixture.nativeElement.querySelector('.editor-notification.is-danger');
				expect(el.classList).not.toContain('is-visible');
			});

			it('should render the error message text', () => {
				component.editorError.set('Failed to save post');
				fixture.detectChanges();
				const span = fixture.nativeElement.querySelector(
					'.editor-notification.is-danger span',
				);
				expect(span.textContent).toContain('Failed to save post');
			});

			it('should clear editorError when the dismiss button is clicked', () => {
				component.editorError.set('Error!');
				fixture.detectChanges();
				fixture.nativeElement
					.querySelector('.editor-notification.is-danger .notification-close')
					.click();
				expect(component.editorError()).toBeNull();
			});
		});

		describe('editor fields', () => {
			it('should show editor fields when mode is "create"', () => {
				component.editorMode.set('create');
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-panel .editor-fields'),
				).toBeTruthy();
			});

			it('should show editor fields when mode is "edit"', () => {
				component.editorMode.set('edit');
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-panel .editor-fields'),
				).toBeTruthy();
			});

			it('should hide editor fields in preview mode', () => {
				component.editorMode.set('preview');
				fixture.detectChanges();
				expect(
					fixture.nativeElement.querySelector('.editor-panel .editor-fields'),
				).toBeFalsy();
			});

			it('should reflect formTitle in the title input', async () => {
				component.formTitle.set('My Post Title');
				fixture.detectChanges();
				await fixture.whenStable();
				const input: HTMLInputElement = fixture.nativeElement.querySelector('#post-title');
				expect(input.value).toBe('My Post Title');
			});

			it('should update formTitle and auto-generate the slug when the title input changes', async () => {
				component.editorMode.set('create');
				fixture.detectChanges();
				const input: HTMLInputElement = fixture.nativeElement.querySelector('#post-title');
				input.value = 'Hello World';
				input.dispatchEvent(new Event('input'));
				await fixture.whenStable();
				expect(component.formTitle()).toBe('Hello World');
				expect(component.formSlug()).toBe('hello-world');
			});

			it('should reflect formSlug in the slug input', async () => {
				component.formSlug.set('my-post-slug');
				fixture.detectChanges();
				await fixture.whenStable();
				const input: HTMLInputElement = fixture.nativeElement.querySelector('#post-slug');
				expect(input.value).toBe('my-post-slug');
			});

			it('should always keep the slug input disabled', () => {
				fixture.detectChanges();
				const input: HTMLInputElement = fixture.nativeElement.querySelector('#post-slug');
				expect(input.disabled).toBe(true);
			});

			it('should reflect formAuthor in the author input', async () => {
				component.formAuthor.set('Jane Doe');
				fixture.detectChanges();
				await fixture.whenStable();
				const input: HTMLInputElement = fixture.nativeElement.querySelector('#post-author');
				expect(input.value).toBe('Jane Doe');
			});

			it('should update formAuthor when the author input changes', async () => {
				fixture.detectChanges();
				const input: HTMLInputElement = fixture.nativeElement.querySelector('#post-author');
				input.value = 'New Author';
				input.dispatchEvent(new Event('input'));
				await fixture.whenStable();
				expect(component.formAuthor()).toBe('New Author');
			});

			it('should reflect formExcerpt in the excerpt textarea', async () => {
				component.formExcerpt.set('A short summary');
				fixture.detectChanges();
				await fixture.whenStable();
				const ta: HTMLTextAreaElement =
					fixture.nativeElement.querySelector('#post-excerpt');
				expect(ta.value).toBe('A short summary');
			});

			it('should update formExcerpt when the excerpt textarea changes', async () => {
				fixture.detectChanges();
				const ta: HTMLTextAreaElement =
					fixture.nativeElement.querySelector('#post-excerpt');
				ta.value = 'Updated excerpt';
				ta.dispatchEvent(new Event('input'));
				await fixture.whenStable();
				expect(component.formExcerpt()).toBe('Updated excerpt');
			});

			it('should reflect formRawContent in the content textarea', async () => {
				component.formRawContent.set('# Hello Markdown');
				fixture.detectChanges();
				await fixture.whenStable();
				const ta: HTMLTextAreaElement =
					fixture.nativeElement.querySelector('#post-content');
				expect(ta.value).toBe('# Hello Markdown');
			});

			it('should update formRawContent when the content textarea changes', async () => {
				fixture.detectChanges();
				const ta: HTMLTextAreaElement =
					fixture.nativeElement.querySelector('#post-content');
				ta.value = '## Updated content';
				ta.dispatchEvent(new Event('input'));
				await fixture.whenStable();
				expect(component.formRawContent()).toBe('## Updated content');
			});
		});

		describe('preview pane', () => {
			beforeEach(() => {
				component.editorMode.set('preview');
				fixture.detectChanges();
			});

			it('should show the preview pane only in preview mode', () => {
				expect(fixture.nativeElement.querySelector('.preview-pane')).toBeTruthy();
				component.editorMode.set('create');
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.preview-pane')).toBeFalsy();
			});

			it('should show the empty-state message when both title and content are blank', () => {
				component.formTitle.set('');
				component.formRawContent.set('');
				fixture.detectChanges();
				const el = fixture.nativeElement.querySelector('.preview-empty');
				expect(el).toBeTruthy();
				expect(el.textContent).toContain('Nothing to preview yet.');
			});

			it('should suppress the empty-state when a title is present', () => {
				component.formTitle.set('Some Title');
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.preview-empty')).toBeFalsy();
			});

			it('should suppress the empty-state when content is present', () => {
				component.formRawContent.set('# Some content');
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.preview-empty')).toBeFalsy();
			});

			it('should render the title in the preview heading', () => {
				component.formTitle.set('My Preview Title');
				fixture.detectChanges();
				const h1 = fixture.nativeElement.querySelector('.preview-title');
				expect(h1.textContent).toContain('My Preview Title');
			});

			it('should show the author paragraph when formAuthor is set', () => {
				component.formTitle.set('Title');
				component.formAuthor.set('Jane Author');
				fixture.detectChanges();
				const el = fixture.nativeElement.querySelector('.preview-author');
				expect(el).toBeTruthy();
				expect(el.textContent).toContain('Jane Author');
			});

			it('should omit the author paragraph when formAuthor is empty', () => {
				component.formTitle.set('Title');
				component.formAuthor.set('');
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.preview-author')).toBeFalsy();
			});

			it('should show the excerpt paragraph when formExcerpt is set', () => {
				component.formTitle.set('Title');
				component.formExcerpt.set('Short description here');
				fixture.detectChanges();
				const el = fixture.nativeElement.querySelector('.preview-excerpt');
				expect(el).toBeTruthy();
				expect(el.textContent).toContain('Short description here');
			});

			it('should omit the excerpt paragraph when formExcerpt is empty', () => {
				component.formTitle.set('Title');
				component.formExcerpt.set('');
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.preview-excerpt')).toBeFalsy();
			});

			it('should render a <markdown> element for markdown sections', async () => {
				component.formTitle.set('Title');
				component.formRawContent.set('# Hello World');
				fixture.detectChanges();
				await fixture.whenStable();
				expect(
					fixture.nativeElement.querySelector('.preview-content markdown'),
				).toBeTruthy();
			});

			it('should render an <app-carousel> element for carousel sections', async () => {
				component.formTitle.set('Title');
				component.formRawContent.set(
					'---carousel-start---\ntest.jpg | Alt text\n---carousel-end---',
				);
				fixture.detectChanges();
				await fixture.whenStable();
				expect(
					fixture.nativeElement.querySelector('.preview-content app-carousel'),
				).toBeTruthy();
			});

			it('should render both markdown and carousel elements for mixed content', async () => {
				component.formTitle.set('Title');
				component.formRawContent.set(
					'Intro\n---carousel-start---\ntest.jpg | alt\n---carousel-end---\nOutro',
				);
				fixture.detectChanges();
				await fixture.whenStable();
				expect(
					fixture.nativeElement.querySelector('.preview-content markdown'),
				).toBeTruthy();
				expect(
					fixture.nativeElement.querySelector('.preview-content app-carousel'),
				).toBeTruthy();
			});
		});
	});
});
