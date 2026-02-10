import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageData, CreateMessageData } from '../../interfaces/message-data';
import { environment } from '../../../environments/environment.development';

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
  private apiUrl = environment.apiUrl;

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
      `${this.apiUrl}/contact`,
      body.toString(),
      { headers, withCredentials: false }
    );
  }

  getMessages(page: number = 0, pageSize: number = 10): Observable<MessagesPageResponse> {
    return this.http.get<MessagesPageResponse>(
      `${this.apiUrl}/admin/messages`,
      {
        params: { page: page.toString(), page_size: pageSize.toString() },
        withCredentials: true
      }
    );
  }

  // generate uuid v4 for idempotency key
  private generateIdempotencyKey(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
}
