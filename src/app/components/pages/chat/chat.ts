import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { scan } from 'rxjs/operators';
import { ChatService, ChatMessage } from '@services/chat/chat-service';

@Component({
	selector: 'app-chat',
	imports: [CommonModule, FormsModule, FeatherModule],
	templateUrl: './chat.html',
	styleUrl: './chat.scss',
})
export class Chat implements OnInit{
	private chatService = inject(ChatService);
	private platformId = inject(PLATFORM_ID);

	// think about this: a message needs
	// from: (a user id, associated with a name)
	// message content: string
	// timestamp: Date
	// a message_id: UUID
	messages = toSignal(
		this.chatService.messages$.pipe(
			scan((acc: ChatMessage[], message: ChatMessage) => [...acc, message], [] as ChatMessage[])
		),
		{ initialValue: [] as ChatMessage[] }
	);
	
	newMessage = signal('');
	loadingMessages = signal(false);

	ngOnInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		this.loadingMessages.set(true);
		this.chatService.connect().then(() => {
			this.loadingMessages.set(false);
		});

		
	}
}
