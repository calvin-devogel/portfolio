import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BlogService } from '@services/blog/blog-service';
import { BlogPost } from '@interfaces/blog-data';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';

@Component({
  selector: 'app-blog-individual',
  standalone: true,
  imports: [RouterLink, DatePipe, MarkdownComponent],
  providers: [provideMarkdown()],
  templateUrl: './blog-individual.html',
  styleUrls: ['./blog-individual.scss'],
})
export class BlogIndividual implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);

  post = signal<BlogPost | null>(null);
  loading = signal(true);
  // these should probably have actual messages or something
  error = signal(false);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPost(slug);
    }
  }

  private loadPost(slug: string) {
    this.loading.set(true);
    this.error.set(false);

    // up next: get-by-slug to fetch individual posts
    this.blogService.getPosts(0, 10, true, slug).subscribe({
      next: (response) => {
        if (response.data.length > 0) {
          this.post.set(response.data[0]);
        } else {
          this.error.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
