import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService } from '@services/blog/blog-service'
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { BlogPost, CreateBlogPost } from '@interfaces/blog-data';

type EditorMode = 'create' | 'edit' | 'preview';

@Component({
  selector: 'app-blog',
  imports: [
    CommonModule,
    FormsModule,
    FeatherModule,
  ],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog implements OnInit {
  private blogService = inject(BlogService);

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

  ngOnInit() {
    this.loadPosts();
  }

  // list actions
  loadPosts() {
    this.loadingPosts.set(true);
    this.listError.set(null);
    this.blogService.getPosts(this.currentPage(), this.pageSize()).subscribe({
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
  // endpoint shouldn't need a PUT but 
  // can currently only update isPublished, so come back to this
  savePost(): void {
    this.clearMessages();
    this.saving.set(true);

    const payload: CreateBlogPost = {
      title: this.form.title,
      content: this.form.content,
      excerpt: this.form.excerpt,
      author: this.form.author,
    };

    this.blogService.createPost(payload).subscribe({
      next: (response) => {
        this.editorSuccess.set(`Post ${this.form.title} created successfully.`);
        this.saving.set(false);
        this.loadPosts();
        this.newPost();
      },
      error: (err) => {
        this.editorError.set('Failed to save post: ' + (err.error?.error || err.message || 'Unknown error'));
        this.saving.set(false);
      }
    });
  }

  togglePublish(): void {
    const post = this.selectedPost();
    if (!post) return;
    this.clearMessages();
    this.saving.set(true);
    this.blogService.patchPost(post.post_id, !post.published ).subscribe({
      next: () => {
        const updated = { ...post, published: !post.published };
        this.selectedPost.set(updated);
        this.posts.update(list =>
          list.map(p => p.post_id === post.post_id ? updated : p)
        );
        this.editorSuccess.set(`Post ${updated.published ? 'published' : 'unpublished'}.`);
        this.saving.set(false);
      },
      error: () => {
        this.editorError.set('Failed to update publish status.');
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
        this.newPost();
        this.deleting.set(false);
      },
      error: () => {
        this.editorError.set('Failed to delete post.');
        this.deleting.set(false);
      }
    });
  }
  
  // helpers

  clearMessages(): void {
    this.editorError.set(null);
    this.editorSuccess.set(null);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
  }

  previewLines = computed(() => this.form.content.split('\n').map(l => l.trim()).filter(Boolean));
}
