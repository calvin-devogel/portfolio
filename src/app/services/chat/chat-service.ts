import { Injectable, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, lastValueFrom } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

// should include a timestamp?
export interface ChatMessage {
	userId: string;
	text: string;
	timestamp: Date;
}

@Injectable({
	providedIn: 'root'
})
export class ChatService implements OnDestroy {
	private platformId = inject(PLATFORM_ID);
	private http = inject(HttpClient);

	private connection: HubConnection | null = null;
	public messages$ = new Subject<ChatMessage>();

	async connect(): Promise<void> {
		if(!isPlatformBrowser(this.platformId)) return;
		if(this.connection) return;

		// get the short-term auth token
		const { token } = await lastValueFrom(
			this.http.get<{ token: string }>('/api/chat_token', { withCredentials: true })
		).then(res => res!);

		this.connection = new HubConnectionBuilder()
			.withUrl('/chathub', { accessTokenFactory: () => token })
			.withAutomaticReconnect()
			.build();

		this.connection.on('ReceiveMessage', (userId: string, text: string) => {
			this.messages$.next({ userId, text, timestamp: new Date() });
		});

		await this.connection.start();
	}

	async sendMessage(text: string): Promise<void> {
		await this.connection?.invoke('SendMessage', text);
	}

	async disconnect(): Promise<void> {
		await this.connection?.stop();
		this.connection = null;
	}

	ngOnDestroy(): void {
		this.disconnect();
	}
}