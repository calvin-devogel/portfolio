import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SeoData } from '../../interfaces/seo-data';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title)
  private document = inject(DOCUMENT);
  private readonly DEFAULT_OG_IMAGE = 'https://devogel.dev/og-image.png';

  updateSeo(data: SeoData): void {
    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ property: 'og:description', content: data.ogDescription || data.description });
    this.meta.updateTag({ property: 'og:type', content: data.ogType || 'website' });
    this.meta.updateTag({ property: 'og:image', content: data.ogImage || this.DEFAULT_OG_IMAGE });

    if (data.article) {
      this.setArticleTags(data.article);
    } else {
      this.removeArticleTags();
    }

    if (data.canonicalUrl) {
      this.setCanonicalUrl(data.canonicalUrl);
    }

    if (data.structuredData) {
      this.setStructuredData(data.structuredData);
    } else {
      this.removeStructuredData();
    }
  }

  private setArticleTags(article: NonNullable<SeoData['article']>): void {
    if (article.publishedTime) {
      this.meta.updateTag({ property: 'article:published_time', content: article.publishedTime });
    }
    if (article.modifiedTime) {
      this.meta.updateTag({ property: 'article:modified_time', content: article.modifiedTime });
    }
    if (article.author) {
      this.meta.updateTag({ property: 'article:author', content: article.author });
    }
  }

  private removeArticleTags(): void {
    ['article:published_time', 'article:modified_time', 'article:author'].forEach(property => {
      const tag = this.meta.getTag(`property='${property}'`);
      if (tag) {
        this.meta.removeTagElement(tag);
      }
    });
  }

  private setCanonicalUrl(url: string): void {
    const link: HTMLLinkElement = this.document.querySelector<HTMLLinkElement>("link[rel='canonical']") || this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    if (!link.parentNode) {
      this.document.head.appendChild(link);
    }
  }

  private setStructuredData(
    data: Record<string, unknown> | Record<string, unknown>[]
  ): void {
    this.removeStructuredData();

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', 'structured-data');
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeStructuredData(): void {
    const existingScript = this.document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }
  }
}
