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

  updateSeo(data: SeoData): void {
    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ property: 'og:description', content: data.ogDescription || data.description });
    this.meta.updateTag({ property: 'og:type', content: data.ogType || 'website' });

    if (data.canonicalUrl) {
      this.setCanonicalUrl(data.canonicalUrl);
    }

    if (data.structuredData) {
      this.setStructuredData(data.structuredData);
    } else {
      this.removeStructuredData();
    }
  }

  private setCanonicalUrl(url: string): void {
    let link: HTMLLinkElement = this.document.querySelector<HTMLLinkElement>("link[rel='canonical']") || this.document.createElement('link');
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
