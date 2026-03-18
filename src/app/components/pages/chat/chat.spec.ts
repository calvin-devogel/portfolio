import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ChatMessage, ChatService } from '@services/chat/chat-service';
import { Chat } from './chat';

describe('Chat', () => {
	let component: Chat;
	let fixture: ComponentFixture<Chat>;

	const mockChatService = {
		messages$: new Subject<ChatMessage>(),
		connect: vi.fn().mockResolvedValue(undefined),
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [Chat],
			providers: [{ provide: ChatService, useValue: mockChatService }],
		}).compileComponents();

		fixture = TestBed.createComponent(Chat);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
