import { PersonSchema, WebPageSchema, BreadcrumbSchema } from '../../interfaces/seo-data';

const BASE_URL = 'https://devogel.dev';

export const personSchema: PersonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Calvin de Vogel',
    url: BASE_URL,
    jobTitle: 'Software Engineer',
    description: "Hi, I'm Cal, a software engineer specializing in full-stack, cloud-native application development. Welcome to my portfolio, where I showcase my projects, experience, and passion for software development.",
    sameAs: [
        'https://www.linkedin.com/in/calvin-devogel/',
        'https://github.com/calvin-devogel'
    ],
    knowsAbout: ['Angular', 'TypeScript', 'Node.js', '.NET', 'Docker', 'DigitalOcean', 'Rust', 'SQL', 'Software Architecture', 'Cloud-Native Development']
};

export const homeSchema: WebPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  name: "Calvin de Vogel | Portfolio",
  description: 'Portfolio of Calvin de Vogel, a software engineer.',
  url: BASE_URL,
  author: { '@type': 'Person', name: 'Calvin de Vogel' }
};

export const resumeSchema: WebPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: "Calvin de Vogel | Resume",
  description: "View the professional experience, skills, and education of Calvin de Vogel.",
  url: `${BASE_URL}/resume`,
  author: { '@type': 'Person', name: 'Calvin de Vogel' }
};

export const projectsSchema: WebPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: "Calvin de Vogel | Projects",
  description: "Check out some of Calvin de Vogel's projects to see his areas of interest and expertise.",
  url: `${BASE_URL}/projects`,
  author: { '@type': 'Person', name: 'Calvin de Vogel' }
};

export const contactSchema: WebPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: "Calvin de Vogel | Contact",
  description: "Get in touch with Calvin de Vogel.",
  url: `${BASE_URL}/contact`,
  author: { '@type': 'Person', name: 'Calvin de Vogel' }
};

export function breaddrumbSchema(
  items: { name: string, path: string}[]
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`
    })),
  };
}