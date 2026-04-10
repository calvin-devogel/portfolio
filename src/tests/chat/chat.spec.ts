import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatMessage, ChatService, ChatUser } from '@app/chat/services/chat-service';
import { Chat } from '@app/chat/components/chat/chat';
import { FeatherModule } from 'angular-feather';
import { importProvidersFrom, signal } from '@angular/core';
import { allIcons } from 'angular-feather/icons';

const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
	userId: '2',
	username: 'OtherUser',
	text: 'Hello',
	timestamp: new Date('2025-01-01T12:00:00Z'),
	...overrides,
});

describe('Chat', () => {
	let component: Chat;
	let fixture: ComponentFixture<Chat>;
	let messages$: Subject<ChatMessage>;
	let activeUsers$: BehaviorSubject<ChatUser[]>;
	let mockConnect: ReturnType<typeof vi.fn>;
	let mockSendMessage: ReturnType<typeof vi.fn>;
	let connectResolve!: () => void;

	beforeEach(async () => {
		messages$ = new Subject<ChatMessage>();
		activeUsers$ = new BehaviorSubject<ChatUser[]>([]);
		mockConnect = vi.fn().mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					connectResolve = resolve;
				}),
		);
		mockSendMessage = vi.fn();

		await TestBed.configureTestingModule({
			imports: [Chat],
			providers: [
				{
					provide: ChatService,
					useValue: {
						messages$,
						activeUsers$,
						connect: mockConnect,
						currentUser: signal<ChatUser | null>({ userId: '1', username: 'TestUser' }),
						sendMessage: mockSendMessage,
					},
				},
				importProvidersFrom(FeatherModule.pick(allIcons)),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Chat);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => vi.restoreAllMocks());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('loading state', () => {
		it('sets loadingMessages to true while connecting', () => {
			expect(component.loadingMessages()).toBe(true);
		});

		it('shows connecting indicator in the DOM', () => {
			const element = fixture.nativeElement as HTMLElement;
			expect(element.textContent).toContain('Connecting');
		});

		it('disables the text input while connecting', () => {
			const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
			expect(input.disabled).toBe(true);
		});

		it('disables the send button while connecting', () => {
			const button = fixture.nativeElement.querySelector('.pill-button') as HTMLButtonElement;
			expect(button.disabled).toBe(true);
		});
	});

	describe('after connection resolves', () => {
		beforeEach(async () => {
			connectResolve();
			await fixture.whenStable();
			fixture.detectChanges();
		});

		it('clears loadingMessages after connect() resolves', () => {
			expect(component.loadingMessages()).toBe(false);
		});

		it('calls connect() exactly once on init', () => {
			expect(mockConnect).toHaveBeenCalledOnce();
		});

		describe('empty state', () => {
			it('shows the empty state message when no messages have arrived', () => {
				const element = fixture.nativeElement as HTMLElement;
				expect(element.textContent).toContain('No messages yet');
			});

			it('renders no chat-message elements', () => {
				const messages = fixture.nativeElement.querySelectorAll('.chat-message');
				expect(messages.length).toBe(0);
			});
		});

		describe('messages', () => {
			it('renders a message when the stream emits', () => {
				messages$.next(makeMessage());
				fixture.detectChanges();
				const messages = fixture.nativeElement.querySelectorAll('.chat-message');
				expect(messages.length).toBe(1);
			});

			it('renders multiple messages in order', () => {
				messages$.next(makeMessage({ text: 'First' }));
				messages$.next(makeMessage({ text: 'Second' }));
				fixture.detectChanges();
				const messages = fixture.nativeElement.querySelectorAll('.chat-message');
				expect(messages.length).toBe(2);
			});

			it('displays message text content', () => {
				messages$.next(makeMessage({ text: 'Hello, world!' }));
				fixture.detectChanges();
				const textElement = fixture.nativeElement.querySelector('.chat-message .text');
				expect(textElement?.textContent?.trim()).toBe('Hello, world!');
			});

			it('displays the sender username', () => {
				messages$.next(makeMessage({ username: 'Alice' }));
				fixture.detectChanges();
				const usernameElement =
					fixture.nativeElement.querySelector('.chat-message .username');
				expect(usernameElement?.textContent?.trim()).toBe('Alice');
			});

			it('applies .is-mine to messages from the current user', () => {
				messages$.next(makeMessage({ userId: '1' }));
				fixture.detectChanges();
				const message = fixture.nativeElement.querySelector('.chat-message');
				expect(message?.classList.contains('is-mine')).toBe(true);
			});

			it('does not apply .is-mine to messages from other users', () => {
				messages$.next(makeMessage({ userId: '2' }));
				fixture.detectChanges();
				const message = fixture.nativeElement.querySelector('.chat-message');
				expect(message?.classList.contains('is-mine')).toBe(false);
			});

			it('caps the message list at 100 entries', () => {
				for (let i = 0; i < 105; i++) {
					messages$.next(makeMessage({ text: `message ${i}`, timestamp: new Date(i) }));
				}
				expect(component.messages().length).toBe(100);
			});
		});

		describe('send button', () => {
			it('is disabled when the input is empty', () => {
				component.newMessage.set('');
				fixture.detectChanges();
				const button = fixture.nativeElement.querySelector(
					'.pill-button',
				) as HTMLButtonElement;
				expect(button.disabled).toBe(true);
			});

			it('is disabled when the input is only whitespace', () => {
				component.newMessage.set('   ');
				fixture.detectChanges();
				const button = fixture.nativeElement.querySelector(
					'.pill-button',
				) as HTMLButtonElement;
				expect(button.disabled).toBe(true);
			});

			it('is enabled when the input has content', () => {
				component.newMessage.set('Hello');
				fixture.detectChanges();
				const button = fixture.nativeElement.querySelector(
					'.pill-button',
				) as HTMLButtonElement;
				expect(button.disabled).toBe(false);
			});
		});

		describe('send()', () => {
			it('calls sendMessage with the typed text', () => {
				component.newMessage.set('Hello');
				component.send();
				expect(mockSendMessage).toHaveBeenCalledWith('Hello');
			});

			it('clears the input after sending', () => {
				component.newMessage.set('hello');
				component.send();
				expect(component.newMessage()).toBe('');
			});

			it('does nothing when the input is empty', () => {
				component.newMessage.set('');
				component.send();
				expect(mockSendMessage).not.toHaveBeenCalled();
			});

			it('does nothing when the input is only whitespace', () => {
				component.newMessage.set('   ');
				component.send();
				expect(mockSendMessage).not.toHaveBeenCalled();
			});
		});

		describe('active users panel', () => {
			it('renders a user pill for each active user', () => {
				activeUsers$.next([
					{ userId: '1', username: 'Alice' },
					{ userId: '2', username: 'Bob' },
				]);
				fixture.detectChanges();
				const pills = fixture.nativeElement.querySelectorAll('.user-pill');
				expect(pills.length).toBe(2);
			});

			it('displays the username in each pill', () => {
				activeUsers$.next([{ userId: '2', username: 'Alice' }]);
				fixture.detectChanges();
				const nameElement = fixture.nativeElement.querySelector('.user-pill-name');
				expect(nameElement?.textContent?.trim()).toBe('Alice');
			});

			it('shows the you-badge for the current user', () => {
				activeUsers$.next([
					{ userId: '1', username: 'Alice' },
					{ userId: '2', username: 'Bob' },
				]);
				fixture.detectChanges();
				const badges = fixture.nativeElement.querySelectorAll('.you-badge');
				expect(badges.length).toBe(1);
			});

			it('does not show the you-badge for other users', () => {
				activeUsers$.next([
					{ userId: '2', username: 'Bob' },
					{ userId: '3', username: 'Charlie' },
				]);
				fixture.detectChanges();
				const badges = fixture.nativeElement.querySelectorAll('.you-badge');
				expect(badges.length).toBe(0);
			});

			it('shows the no-users element when the list is empty', () => {
				activeUsers$.next([]);
				fixture.detectChanges();
				expect(fixture.nativeElement.querySelector('.no-users')).toBeTruthy();
				expect(fixture.nativeElement.querySelectorAll('.user-pill').length).toBe(0);
			});
		});
	});

	describe('userColor()', () => {
		it('returns a color from the palette based on userId', () => {
			const color = component.userColor('some-user-id');
			expect(color).toBeTruthy();
			expect(typeof color).toBe('string');
		});

		it('is deterministic for the same userId', () => {
			const color1 = component.userColor('consistent-id');
			const color2 = component.userColor('consistent-id');
			expect(color1).toBe(color2);
		});
	});
});
