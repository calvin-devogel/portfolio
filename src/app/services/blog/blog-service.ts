import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
// you gotta stop saying "post" it gets confusing
import { BlogPost, CreateBlogPost, BlogPageResponse, RawBlogPageResponse } from '../../interfaces/blog-data';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private http = inject(HttpClient);

  getPosts(page: number = 0, pageSize: number = 10, onPublished: boolean = false, slug?: string): Observable<BlogPageResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'BlogPost-Page': page.toString(),
      'BlogPost-Page-Size': pageSize.toString(),
      'BlogPost-On-Published': onPublished.toString(),
      'slug': slug ?? ''
    });

    return this.http.get<RawBlogPageResponse>('/api/blog', {
      headers
    })
    .pipe(
      map((response) => {
        const data = Array.isArray(response.data) ? response.data : [];
        const normalizedPage = Number(response.page ?? page);
        const normalizedPageSize = Number(response.page_size ?? pageSize);

        const totalRaw =
          response.total_items ??
          response.total_count ??
          response.total ??
          data.length;
        
        const normalizedTotal = Number(totalRaw);

        return {
          data,
          pagination: {
            page: Number.isFinite(normalizedPage) ? normalizedPage : page,
            page_size: Number.isFinite(normalizedPageSize) ? normalizedPageSize : pageSize,
            total_items: Number.isFinite(normalizedTotal) ? normalizedTotal : data.length,
            total_pages: Number.isFinite(normalizedPageSize) && normalizedPageSize > 0
              ? Math.ceil((Number.isFinite(normalizedTotal) ? normalizedTotal : data.length) / normalizedPageSize)
              : 0,
          },
        };
      })
    )
  }

  createPost(post: CreateBlogPost): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID()});
    return this.http.post<void>('/api/admin/blog/post', post, {
      withCredentials: true, headers
    })
  }

  publishPost(postId: string, published: boolean): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID()});
    return this.http.patch<void>('/api/admin/blog/publish',
      { post_id: postId, published },
      {
        withCredentials: true,
        headers
      }
    )
  }

  editPost(postId: string, edits: Partial<BlogPost>): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID()});
    return this.http.patch<void>('/api/admin/blog/edit',
      { post_id: postId, ...edits },
      {
        withCredentials: true,
        headers
      }
    )
  }

  deletePost(postId: string): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID()});
    return this.http.delete<void>('/api/admin/blog/delete', {
      body: { blog_post_id: postId },
      withCredentials: true,
      headers
    })
  }
}
