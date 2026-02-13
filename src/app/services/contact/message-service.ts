import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageData, CreateMessageData } from '../../interfaces/message-data';

interface MessageResponse {
  message: string;
  message_id: string;
}

interface MessagesPageResponse {
  messages: MessageData[];
  page: number;
  page_size: number;
  total_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private http = inject(HttpClient);

  sendMessage(messageData: CreateMessageData): Observable<MessageResponse> {
    const idempotencyKey = this.generateIdempotencyKey();

    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey
    });

    const body = new URLSearchParams();
    body.set('email', messageData.email);
    body.set('sender_name', messageData.sender_name);
    body.set('message_text', messageData.message_text);

    return this.http.post<MessageResponse>(
      '/api/contact',
      body.toString(),
      { headers, withCredentials: false }
    );
  }

  getMessages(page: number = 0, pageSize: number = 10): Observable<MessagesPageResponse> {
    return this.http.get<MessagesPageResponse>(
      '/api/admin/messages',
      {
        params: { page: page.toString(), page_size: pageSize.toString() },
        withCredentials: true
      }
    );
  }

  patchMessage(messageId: string, read: boolean): Observable<void> {
    const idempotencyKey = this.generateIdempotencyKey();

    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    });

    return this.http.patch<void>(
      '/api/admin/messages',
      { message_id: messageId, read: read },
      { headers, withCredentials: true }
    );
  }

  // generate uuid v4 for idempotency key
  private generateIdempotencyKey(): string {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      // Fallback for environments without crypto.randomUUID
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }
  
}
