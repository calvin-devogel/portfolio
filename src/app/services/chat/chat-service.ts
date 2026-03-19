import { Injectable, PLATFORM_ID, inject, OnDestroy, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, lastValueFrom, BehaviorSubject } from 'rxjs';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// should include a timestamp?
export interface ChatMessage {
	userId: string;
	username: string;
	text: string;
	timestamp: Date;
}

export interface ChatUser {
	userId: string;
	username: string;
}

@Injectable({
	providedIn: 'root',
})
export class ChatService implements OnDestroy {
	private platformId = inject(PLATFORM_ID);
	private http = inject(HttpClient);
	private connection: HubConnection | null = null;

	public messages$ = new Subject<ChatMessage>();
	public activeUsers$ = new BehaviorSubject<ChatUser[]>([]);
	public currentUser = signal<ChatUser | null>(null);

	async connect(): Promise<void> {
		if (!isPlatformBrowser(this.platformId)) return;
		if (this.connection) return;

		// get the short-term auth token
		const { token } = await lastValueFrom(
			this.http.get<{ token: string }>('/api/chat_token', { withCredentials: true }),
		).then((res) => res!);

		const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
		this.currentUser.set({ userId: payload.sub, username: payload.name });

		this.connection = new HubConnectionBuilder()
			.withUrl('/chathub', { accessTokenFactory: () => token })
			.withAutomaticReconnect()
			.configureLogging(LogLevel.Error)
			.build();

		this.connection.on('MessageHistory', (history: ChatMessage[]) => {
			for (const message of history) {
				this.messages$.next({
					...message,
					timestamp: new Date(message.timestamp as unknown as number),
				});
			}
		});

		this.connection.on('ReceiveMessage', (userId, username, text, timestamp: number) => {
			this.messages$.next({ userId, username, text, timestamp: new Date(timestamp) });
		});

		this.connection.on('ActiveUsers', (users: ChatUser[]) => {
			this.activeUsers$.next(users);
		});

		this.connection.on('UserJoined', (userId: string, username: string) => {
			const current = this.activeUsers$.getValue();
			this.activeUsers$.next([...current, { userId, username }]);
		});

		this.connection.on('UserLeft', (userId: string) => {
			const current = this.activeUsers$.getValue();
			this.activeUsers$.next(current.filter((u) => u.userId !== userId));
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
