export interface CarouselImage {
    src: string;
    alt?: string;
    caption?: string;
}

export interface BlogSection {
    type: 'markdown' | 'carousel';
    content?: string;
    label?: string;
    slides?: CarouselImage[];
}

export interface CreateBlogPost {
    title: string;
    sections: BlogSection[];
    excerpt: string;
    author: string;
}

export interface BlogPost {
    post_id: string;
    title: string;
    slug: string;
    sections: BlogSection[];
    excerpt: string;
    author: string;
    published: boolean;
    created_at: string;
    updated_at: string;
}

// this is inconsistent with message responses,
// update that to add a pagination field
export interface BlogPageResponse {
    data: BlogPost[];
    pagination: {
        page: number;
        page_size: number;
        total_items: number;
        total_pages: number;
    }
}

export interface RawBlogPageResponse {
    data?: BlogPost[];
    page?: number;
    page_size?: number;
    total_items?: number;
    total_count?: number;
    total?: number;
    error?: string;
}