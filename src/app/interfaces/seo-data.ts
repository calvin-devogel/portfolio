export interface SeoData {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

export interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  url: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  [key: string]: unknown;
}

export interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage' | 'ProfilePage' | 'AboutPage' | 'ContactPage';
  name: string;
  description: string;
  url: string;
  author?: { '@type': 'Person'; name: string };
  [key: string]: unknown;
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

export interface BlogPostingSchema {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  url: string;
  author: { '@type': 'Person'; name: string };
  datePublished?: string;
  dateModified?: string;
  [key: string]: unknown;
}
