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

  getPosts(page: number = 0, pageSize: number = 10): Observable<BlogPageResponse> {
    return this.http.get<RawBlogPageResponse>('/api/blog', {
      params: { page: page.toString(), page_size: pageSize.toString() },
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
    return this.http.post<void>('/api/admin/blog', post, {
      withCredentials: true, headers
    })
  }

  patchPost(postId: string, published: boolean): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID()});
    return this.http.patch<void>('/api/admin/blog',
      { blog_post_id: postId, published },
      {
        withCredentials: true,
        headers
      }
    )
  }

  deletePost(postId: string): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID()});
    return this.http.delete<void>('/api/admin/blog', {
      body: { blog_post_id: postId },
      withCredentials: true,
      headers
    })
  }
}
