import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { scan } from 'rxjs/operators';
import { ChatService, ChatMessage, ChatUser } from '@services/chat/chat-service';
import { PageLayout } from '@components/page-layout/page-layout';
import { FeatherModule } from 'angular-feather';

@Component({
	selector: 'app-chat',
	imports: [CommonModule, FormsModule, PageLayout, FeatherModule],
	templateUrl: './chat.html',
	styleUrl: './chat.scss',
})
export class Chat implements OnInit {
	private chatService = inject(ChatService);
	private platformId = inject(PLATFORM_ID);

	// think about this: a message needs
	// from: (a user id, associated with a name)
	// message content: string
	// timestamp: Date
	// a message_id: UUID
	messages = toSignal(
		this.chatService.messages$.pipe(
			scan((acc: ChatMessage[], message: ChatMessage) => {
				const next = [...acc, message];
				return next.length > 100 ? next.slice(-100) : next;
			}, [] as ChatMessage[]),
		),
		{ initialValue: [] as ChatMessage[] },
	);

	activeUsers = toSignal(this.chatService.activeUsers$, { initialValue: [] as ChatUser[] });
	currentUser = this.chatService.currentUser;

	newMessage = signal('');
	loadingMessages = signal(false);

	ngOnInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		this.loadingMessages.set(true);
		this.chatService.connect().then(() => {
			this.loadingMessages.set(false);
		});
	}

	send(): void {
		const text = this.newMessage();
		if (!text.trim() || !this.chatService.currentUser()) return;

		this.chatService.sendMessage(text);
		this.newMessage.set('');
	}
}
