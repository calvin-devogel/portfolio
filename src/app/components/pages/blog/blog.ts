import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  PLATFORM_ID
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { BlogService } from '@services/blog/blog-service';
import { BlogPost } from '@interfaces/blog-data';
import { PageLayout } from '@components/page-layout/page-layout';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, DatePipe, PageLayout],
  templateUrl: './blog.html',
  styleUrls: ['./blog.scss'],
})
export class Blog implements OnInit, AfterViewInit {
  private blogService = inject(BlogService);
  private platformId = inject(PLATFORM_ID);

  @ViewChildren('postCard') postCards!: QueryList<ElementRef<HTMLElement>>;

  posts = signal<BlogPost[]>([]);
  loading = signal(false);
  error = signal(false);
  activeSlug = signal<string | null>(null);

  private page = 0;
  private pageSize = 10;
  private totalPages = 1;

  hasMore = computed(() => this.page < this.totalPages - 1);

  ngOnInit() {
    this.fetchPosts();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
      this.postCards.changes.subscribe(() => this.setupIntersectionObserver());
    }
  }

  private observer?: IntersectionObserver;

  private setupIntersectionObserver() {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) {
          this.activeSlug.set(visible.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0}
    );

    this.postCards.forEach(card => this.observer!.observe(card.nativeElement));
  }

  fetchPosts() {
    this.loading.set(true);
    this.error.set(false);

    this.blogService.getPosts(this.page, this.pageSize).subscribe({
      next: (response) => {
        this.posts.update(posts => [...posts, ...response.data]);
        this.totalPages = response.pagination.total_pages;
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    if (this.hasMore()) {
      this.page++;
      this.fetchPosts();
    }
  }

  scrollToPost(slug: string) {
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
