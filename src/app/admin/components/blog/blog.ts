import { Component, inject, OnInit, signal, computed, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService } from '@app/blog/services/blog-service';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { BlogPost, CreateBlogPost, BlogSection } from '@app/blog/interfaces/blog-data';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { ModalTemplate } from '@app/shared/components/modal-template/modal-template';
import { Carousel } from '@app/shared/components/carousel/carousel';

type EditorMode = 'create' | 'edit' | 'preview';

@Component({
	selector: 'app-blog',
	imports: [CommonModule, FormsModule, FeatherModule, MarkdownComponent, ModalTemplate, Carousel],
	providers: [provideMarkdown()],
	templateUrl: './blog.html',
	styleUrls: ['./blog.scss', './splitModal.scss'],
})
export class Blog implements OnInit, OnDestroy {
	private blogService = inject(BlogService);
	private successTimeout: ReturnType<typeof setTimeout> | null = null;
	private errorTimeout: ReturnType<typeof setTimeout> | null = null;
	@ViewChild('splitModal') splitModal!: ModalTemplate;

	// post list
	posts = signal<BlogPost[]>([]);
	loadingPosts = signal(false);
	splitModalOpen = signal(false);

	// pagination
	currentPage = signal(0);
	pageSize = signal(20);
	totalPages = signal(0);

	// editor state
	selectedPost = signal<BlogPost | null>(null);
	editorMode = signal<EditorMode>('create');
	saving = signal(false);
	deleting = signal(false);
	editorSuccess = signal<string | null>(null);

	// form fields
	formTitle = signal('');
	formSlug = signal('');
	formExcerpt = signal('');
	formRawContent = signal('');
	formAuthor = signal('');

	isEditing = computed(() => this.selectedPost() !== null);

	private parseRawContent(raw: string): BlogSection[] {
		const CAROUSEL_START = /^---carousel-start(\s+(.+?))?---$/m;
		const CAROUSEL_END = /^---carousel-end---$/m;
		const lines = raw.split('\n');
		const sections: BlogSection[] = [];
		let buffer: string[] = [];
		let inCarousel = false;
		let carouselLabel = '';
		let carouselLines: string[] = [];

		for (const line of lines) {
			const matchStart = line.match(CAROUSEL_START);
			const matchEnd = line.match(CAROUSEL_END);
			if (matchStart && !inCarousel) {
				if (buffer.length > 0) {
					sections.push({ type: 'markdown', content: buffer.join('\n').trim() });
					buffer = [];
				}
				inCarousel = true;
				carouselLabel = matchStart[2] ?? '';
				carouselLines = [];
				buffer = [];
			} else if (matchEnd && inCarousel) {
				sections.push({
					type: 'carousel',
					label: carouselLabel || undefined,
					slides: carouselLines
						.map((l) => l.trim())
						.filter(Boolean)
						.map((l) => {
							const [src, alt, caption] = l.split('|').map((s) => s.trim());
							return { src, alt, caption };
						})
						.filter((slide) => !!slide.src && slide.src.trim().length > 0),
				});
				inCarousel = false;
				carouselLabel = '';
				carouselLines = [];
			} else if (inCarousel) {
				carouselLines.push(line);
			} else {
				buffer.push(line);
			}
		}

		// flush
		if (inCarousel) {
			// unclosed carousel - treat as markdown
			const header = carouselLabel
				? `---carousel-start ${carouselLabel}---`
				: `---carousel-start---`;
			buffer.push(header, ...carouselLines);
			inCarousel = false;
			carouselLabel = '';
			carouselLines = [];
		}

		if (!inCarousel && buffer.length > 0) {
			sections.push({ type: 'markdown', content: buffer.join('\n').trim() });
		}

		return sections.filter((section) =>
			section.type === 'carousel' ? (section.slides?.length ?? 0) > 0 : !!section.content,
		);
	}

	private sectionsToRaw(sections: BlogSection[]): string {
		return sections
			.map((section) => {
				if (section.type === 'carousel') {
					const header = section.label
						? `---carousel-start ${section.label}---`
						: `---carousel-start---`;
					const slideLines = (section.slides ?? [])
						.map((slide) =>
							[slide.src, slide.alt ?? '', slide.caption ?? ''].join(' | '),
						)
						.join('\n');
					return `${header}\n${slideLines}\n---carousel-end---`;
				}
				return section.content ?? '';
			})
			.join('\n\n');
	}

	dirtyFields = computed(() => {
		const post = this.selectedPost();
		if (!post) return null;
		const dirty: Partial<Record<string, boolean>> = {};
		if (this.formTitle() !== post.title) dirty['title'] = true;
		if (this.formExcerpt() !== post.excerpt) dirty['excerpt'] = true;
		if (this.formRawContent() !== this.sectionsToRaw(post.sections)) dirty['rawContent'] = true;
		if (this.formAuthor() !== post.author) dirty['author'] = true;
		return dirty;
	});

	hasDirtyFields = computed(() => {
		const dirty = this.dirtyFields();
		return dirty !== null && Object.keys(dirty).length > 0;
	});

	ngOnInit() {
		this.loadPosts();
	}

	// list actions
	loadPosts() {
		this.loadingPosts.set(true);
		this.blogService.getPosts(this.currentPage(), this.pageSize(), false).subscribe({
			next: (response) => {
				this.posts.set(response.data);
				this.totalPages.set(response.pagination.total_pages);
				this.loadingPosts.set(false);
			},
			error: () => {
				this.loadingPosts.set(false);
			},
		});
	}

	prevPage(): void {
		if (this.currentPage() > 0) {
			this.currentPage.update((page) => page - 1);
			this.loadPosts();
		}
	}

	nextPage(): void {
		if (this.currentPage() < this.totalPages() - 1) {
			this.currentPage.update((page) => page + 1);
			this.loadPosts();
		}
	}

	// editor actions
	selectPost(post: BlogPost): void {
		this.selectedPost.set(post);
		this.editorMode.set('edit');
		this.formTitle.set(post.title);
		this.formSlug.set(post.slug);
		this.formExcerpt.set(post.excerpt);
		this.formRawContent.set(this.sectionsToRaw(post.sections));
		this.formAuthor.set(post.author);
		this.clearMessages();
	}

	newPost(): void {
		this.selectedPost.set(null);
		this.editorMode.set('create');
		this.formTitle.set('');
		this.formSlug.set('');
		this.formExcerpt.set('');
		this.formRawContent.set('');
		this.formAuthor.set('');
		this.clearMessages();
	}

	autoSlug(): void {
		if (this.editorMode() === 'create') {
			this.formSlug.set(this.formTitle().toLowerCase().trim().replace(/\s+/g, '-'));
		}
	}

	setMode(mode: EditorMode): void {
		this.editorMode.set(mode);
	}

	savePost(): void {
		this.clearMessages();
		this.saving.set(true);
		const sections = this.parseRawContent(this.formRawContent());

		if (this.isEditing()) {
			const post = this.selectedPost();
			const dirty = this.dirtyFields();
			if (!dirty || Object.keys(dirty).length === 0) {
				this.saving.set(false);
				return;
			}

			const payload: Partial<BlogPost> = { post_id: post!.post_id };
			if (dirty['title']) payload.title = this.formTitle();
			if (dirty['excerpt']) payload.excerpt = this.formExcerpt();
			if (dirty['rawContent']) payload.sections = sections;
			if (dirty['author']) payload.author = this.formAuthor();

			this.blogService.editPost(post!.post_id, payload).subscribe({
				next: () => {
					const updated = { ...post!, ...payload };
					this.selectedPost.set(updated);
					this.posts.update((list) =>
						list.map((p) => (p.post_id === updated.post_id ? updated : p)),
					);
					this.setSuccess(`Post "${updated.title}" updated successfully`);
					this.saving.set(false);
				},
				error: () => {
					this.saving.set(false);
				},
			});
		} else {
			const payload: CreateBlogPost = {
				title: this.formTitle(),
				sections,
				excerpt: this.formExcerpt(),
				author: this.formAuthor(),
			};

			this.blogService.createPost(payload).subscribe({
				next: () => {
					this.saving.set(false);
					this.loadPosts();
					this.newPost();
					this.setSuccess(`Post "${payload.title}" created successfully`);
				},
				error: () => {
					this.saving.set(false);
				},
			});
		}
	}

	togglePublish(): void {
		const post = this.selectedPost();
		if (!post) return;
		this.clearMessages();
		this.saving.set(true);
		this.blogService.publishPost(post.post_id, !post.published).subscribe({
			next: () => {
				const updated = { ...post, published: !post.published };
				this.selectedPost.set(updated);
				this.posts.update((list) =>
					list.map((p) => (p.post_id === post.post_id ? updated : p)),
				);
				this.setSuccess(`Post ${updated.published ? 'published' : 'unpublished'}.`);
				this.saving.set(false);
			},
			error: () => {
				this.saving.set(false);
			},
		});
	}

	deletePost(): void {
		const post = this.selectedPost();
		if (!post) return;
		if (!confirm(`Delete ${post.title}? This cannot be undone.`)) return;
		this.deleting.set(true);
		this.blogService.deletePost(post.post_id).subscribe({
			next: () => {
				this.posts.update((list) => list.filter((p) => p.post_id !== post.post_id));
				this.deleting.set(false);
				this.closeSplitModal();
				this.newPost();
				this.setSuccess(`Post "${post.title}" deleted successfully.`);
			},
			error: () => {
				this.deleting.set(false);
			},
		});
	}

	// helpers

	openSplitModal(): void {
		this.splitModal.openModal();
	}

	closeSplitModal(): void {
		this.splitModal.closeModal();
	}

	ngOnDestroy(): void {
		this.closeSplitModal();
	}

	setSuccess(message: string, duration = 4000): void {
		if (this.successTimeout) clearTimeout(this.successTimeout);
		this.editorSuccess.set(message);
		this.successTimeout = setTimeout(() => this.editorSuccess.set(null), duration);
	}

	clearMessages(): void {
		if (this.successTimeout) clearTimeout(this.successTimeout);
		if (this.errorTimeout) clearTimeout(this.errorTimeout);
		this.editorSuccess.set(null);
	}

	formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	// previewLines = computed(() => this.form.content.split('\n').map(l => l.trim()).filter(Boolean));
	parsedSections = computed(() => this.parseRawContent(this.formRawContent()));
}
