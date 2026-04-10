import { Injectable, PLATFORM_ID, inject, OnDestroy, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, BehaviorSubject, ReplaySubject } from 'rxjs';
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
	private static readonly MAX_MESSAGE_LENGTH = 500;
	private platformId = inject(PLATFORM_ID);
	private http = inject(HttpClient);
	private connection: HubConnection | null = null;

	public messages$ = new ReplaySubject<ChatMessage>(100);
	public activeUsers$ = new BehaviorSubject<ChatUser[]>([]);
	public currentUser = signal<ChatUser | null>(null);

	async connect(): Promise<void> {
		if (!isPlatformBrowser(this.platformId)) return;
		if (this.connection) return;

		// get the short-term auth token
		const { token } = await lastValueFrom(
			this.http.get<{ token: string }>('/v1/chat_token', { withCredentials: true }),
		).then((res) => res!);
		let payload: { sub?: unknown; name?: unknown };
		try {
			payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
		} catch {
			throw new Error('failed to parse chat token: malformed JWT');
		}

		const userId = payload.sub;
		const username = payload.name;

		if (typeof userId !== 'string' || !userId || typeof username !== 'string' || !username) {
			throw new Error('Failed to parse chat token: missing sub or name claim');
		}

		this.currentUser.set({ userId, username });

		this.connection = new HubConnectionBuilder()
			.withUrl('/ws/chat', { accessTokenFactory: () => token })
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

	private validateMessage(text: string): string {
		const trimmed = text.trim();
		if (!trimmed) {
			throw new Error('Message cannot be empty');
		}

		if (trimmed.length > ChatService.MAX_MESSAGE_LENGTH) {
			throw new Error(`Message exceeds ${ChatService.MAX_MESSAGE_LENGTH} character limit`);
		}

		return (
			trimmed
				.replace(/\r\n|\r/g, '\n')
				// eslint-disable-next-line no-control-regex
				.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
		);
	}

	async sendMessage(text: string): Promise<void> {
		const validated = this.validateMessage(text);
		await this.connection?.invoke('SendMessage', validated);
	}

	async disconnect(): Promise<void> {
		await this.connection?.stop();
		this.connection = null;
		this.activeUsers$.next([]);
		this.currentUser.set(null);
	}

	ngOnDestroy(): void {
		this.disconnect();
	}
}
