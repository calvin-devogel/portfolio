import {
	Component,
	inject,
	OnInit,
	PLATFORM_ID,
	signal,
	ChangeDetectionStrategy,
	ViewChild,
	ElementRef,
	afterEveryRender,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { scan } from 'rxjs/operators';
import { ChatService, ChatMessage, ChatUser } from '@services/chat/chat-service';
import { FeatherModule } from 'angular-feather';

@Component({
	selector: 'app-chat',
	imports: [CommonModule, FormsModule, FeatherModule],
	templateUrl: './chat.html',
	styleUrls: ['./chat.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat implements OnInit {
	private chatService = inject(ChatService);
	private platformId = inject(PLATFORM_ID);
	private router = inject(Router);
	private lastMessageCount = 0;

	private static readonly USER_PALETTE = [
		'var(--primary)',
		'var(--secondary)',
		'var(--accent)',
		'var(--warning)',
		'var(--secondary-light)',
	];

	@ViewChild('messageList') messageList!: ElementRef<HTMLElement>;

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

	constructor() {
		afterEveryRender(() => {
			const count = this.messages().length;
			if (count !== this.lastMessageCount) {
				const behavior: ScrollBehavior = this.lastMessageCount === 0 ? 'instant' : 'smooth';
				this.messageList?.nativeElement.scrollTo({
					top: this.messageList.nativeElement.scrollHeight,
					behavior,
				});
				this.lastMessageCount = count;
			}
		});
	}

	ngOnInit(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		this.loadingMessages.set(true);
		this.chatService
			.connect()
			.then(() => {
				this.loadingMessages.set(false);
			})
			.catch(() => {
				this.loadingMessages.set(false);
				this.router.navigate(['/'], { queryParams: { returnUrl: '/chat' } });
			});
	}

	send(): void {
		const text = this.newMessage();
		if (!text.trim() || !this.chatService.currentUser()) return;

		this.chatService.sendMessage(text);
		this.newMessage.set('');
	}

	userColor(userId: string): string {
		let hash = 0;
		for (let i = 0; i < userId.length; i++) {
			hash = (hash * 31 + userId.charCodeAt(i)) & 0xffff;
		}
		return Chat.USER_PALETTE[hash % Chat.USER_PALETTE.length];
	}
}
