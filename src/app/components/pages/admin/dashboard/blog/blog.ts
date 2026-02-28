import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService } from '@services/blog/blog-service'
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { BlogPost, CreateBlogPost } from '@interfaces/blog-data';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';

type EditorMode = 'create' | 'edit' | 'preview';

@Component({
  selector: 'app-blog',
  imports: [
    CommonModule,
    FormsModule,
    FeatherModule,
    MarkdownComponent,
  ],
  providers: [provideMarkdown()],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog implements OnInit {
  private blogService = inject(BlogService);
  private successTimeout: ReturnType<typeof setTimeout> | null = null;
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;

  // post list
  posts = signal<BlogPost[]>([]);
  loadingPosts = signal(false);
  listError = signal<string | null>(null);

  // pagination
  currentPage = signal(0);
  pageSize = signal(20);
  totalPages = signal(0);

  // editor state
  selectedPost = signal<BlogPost | null>(null);
  editorMode = signal<EditorMode>('create');
  saving = signal(false);
  deleting = signal(false);
  editorError = signal<string | null>(null);
  editorSuccess = signal<string | null>(null);

  // form fields
  form = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
  };

  isEditing = computed(() => this.selectedPost() !== null);

  dirtyFields = computed(() => {
    const post = this.selectedPost();
    if (!post) return null;
    const dirty: Partial<Record<keyof typeof this.form, boolean>> = {};
    if (this.form.title !== post.title) dirty['title'] = true;
    if (this.form.excerpt !== post.excerpt) dirty['excerpt'] = true;
    if (this.form.content !== post.content) dirty['content'] = true;
    if (this.form.author !== post.author) dirty['author'] = true;
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
    this.listError.set(null);
    this.blogService.getPosts(this.currentPage(), this.pageSize(), false).subscribe({
      next: (response) => {
        this.posts.set(response.data);
        this.totalPages.set(response.pagination.total_pages);
        this.loadingPosts.set(false);
      },
      error: (err) => {
        this.listError.set('Failed to load posts: ' + (err.error?.error || err.message || 'Unknown error'));
        this.loadingPosts.set(false);
      }
    });
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(page => page - 1);
      this.loadPosts();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(page => page + 1);
      this.loadPosts();
    }
  }

  // editor actions
  selectPost(post: BlogPost): void {
    this.selectedPost.set(post);
    this.editorMode.set('edit');
    this.form = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
    };
    this.clearMessages();
  }

  newPost(): void {
    this.selectedPost.set(null);
    this.editorMode.set('create');
    this.form = { title: '', slug: '', excerpt: '', content: '', author: '' };
    this.clearMessages();
  }

  autoSlug(): void {
    if (this.editorMode() === 'create') {
      this.form.slug = this.form.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-');
    }
  }

  setMode(mode: EditorMode): void {
    this.editorMode.set(mode);
  }

  savePost(): void {
    this.clearMessages();
    this.saving.set(true);

    if (this.isEditing()) {
      const post = this.selectedPost();
      const dirty = this.dirtyFields();
      if (!dirty || Object.keys(dirty).length === 0) {
        this.saving.set(false);
        return;
      }

      const payload: Partial<BlogPost> = { post_id: post!.post_id };
      if (dirty.title) payload.title = this.form.title;
      if (dirty.excerpt) payload.excerpt = this.form.excerpt;
      if (dirty.content) payload.content = this.form.content;
      if (dirty.author) payload.author = this.form.author;

      this.blogService.editPost(post!.post_id, payload).subscribe({
        next: () => {
          const updated = { ...post!, ...payload };
          this.selectedPost.set(updated);
          this.posts.update(list => 
            list.map(p => p.post_id === updated.post_id ? updated : p)
          );
          this.setSuccess(`Post "${updated.title}" updated successfully`);
          this.saving.set(false);
        },
        error: (err) => {
          this.setError('Failed to update post: ' + (err.error?.error || err.message || 'Unknown error'));
          this.saving.set(false);
        }
      });
    } else {
      const payload: CreateBlogPost = {
        title: this.form.title,
        content: this.form.content,
        excerpt: this.form.excerpt,
        author: this.form.author,
      };

      this.blogService.createPost(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.loadPosts();
          this.newPost();
          this.setSuccess(`Post "${payload.title}" created successfully`);
        },
        error: (err) => {
          this.setError('Failed to create post: ' + (err.error?.error || err.message || 'Unknown error'));
          this.saving.set(false);
        }
      });
    }
  }

  togglePublish(): void {
    const post = this.selectedPost();
    if (!post) return;
    this.clearMessages();
    this.saving.set(true);
    this.blogService.publishPost(post.post_id, !post.published ).subscribe({
      next: () => {
        const updated = { ...post, published: !post.published };
        this.selectedPost.set(updated);
        this.posts.update(list =>
          list.map(p => p.post_id === post.post_id ? updated : p)
        );
        this.setSuccess(`Post ${updated.published ? 'published' : 'unpublished'}.`);
        this.saving.set(false);
      },
      error: () => {
        this.setError('Failed to update publish status.');
        this.saving.set(false);
      }
    });
  }

  deletePost(): void {
    const post = this.selectedPost();
    if (!post) return;
    if (!confirm(`Delete ${post.title}? This cannot be undone.`)) return;
    this.deleting.set(true);
    this.blogService.deletePost(post.post_id).subscribe({
      next: () => {
        this.posts.update(list => list.filter(p => p.post_id !== post.post_id));
        this.deleting.set(false);
        this.newPost();
        this.setSuccess(`Post "${post.title}" deleted successfully.`);
      },
      error: () => {
        this.setError('Failed to delete post.');
        this.deleting.set(false);
      }
    });
  }
  
  // helpers

  setSuccess(message: string, duration = 4000): void {
    if (this.successTimeout) clearTimeout(this.successTimeout);
    this.editorSuccess.set(message);
    this.successTimeout = setTimeout(() => this.editorSuccess.set(null), duration);
  }

  setError(message: string, duration = 6000): void {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.editorError.set(message);
    this.errorTimeout = setTimeout(() => this.editorError.set(null), duration);
  }

  clearMessages(): void {
    if (this.successTimeout) clearTimeout(this.successTimeout);
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.editorError.set(null);
    this.editorSuccess.set(null);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
  }

  previewLines = computed(() => this.form.content.split('\n').map(l => l.trim()).filter(Boolean));
}
