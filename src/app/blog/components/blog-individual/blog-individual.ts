import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BlogService } from '@app/blog/services/blog-service';
import { BlogPost } from '@app/blog/interfaces/blog-data';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { Carousel } from '@app/shared/components/carousel/carousel';
import { PageLayout } from '@app/shared/components/page-layout/page-layout';
import { SeoService } from '@app/shared/services/seo-service';
import { blogPostingSchema, breadCrumbSchema } from '@app/shared/schemas/structured-data.schemas';

@Component({
	selector: 'app-blog-individual',
	imports: [RouterLink, DatePipe, MarkdownComponent, Carousel, PageLayout],
	providers: [provideMarkdown()],
	templateUrl: './blog-individual.html',
	styleUrls: ['./blog-individual.scss'],
})
export class BlogIndividual implements OnInit {
	private route = inject(ActivatedRoute);
	private blogService = inject(BlogService);
	private seoService = inject(SeoService);

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

		this.blogService.getPosts(0, 1, true, slug).subscribe({
			next: (response) => {
				if (response.data.length > 0) {
					const post = response.data[0];
					this.post.set(post);
					this.seoService.updateSeo({
						title: `${post.title} | Calvin de Vogel`,
						description: post.excerpt,
						canonicalUrl: `https://devogel.dev/blog/${post.slug}`,
						ogType: 'article',
						article: {
							publishedTime: post.created_at,
							modifiedTime: post.updated_at,
							author: post.author,
						},
						structuredData: [
							blogPostingSchema(post),
							breadCrumbSchema([
								{ name: 'Home', path: '/' },
								{ name: 'Blog', path: '/blog' },
								{ name: post.title, path: `/blog/${post.slug}` },
							]),
						],
					});
				} else {
					this.error.set(true);
				}
				this.loading.set(false);
			},
			error: () => {
				this.error.set(true);
				this.loading.set(false);
			},
		});
	}
}
