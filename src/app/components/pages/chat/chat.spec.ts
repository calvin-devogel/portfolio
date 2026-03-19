import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ChatMessage, ChatService } from '@services/chat/chat-service';
import { Chat } from './chat';
import { FeatherModule } from 'angular-feather';
import { importProvidersFrom } from '@angular/core';
import { allIcons } from 'angular-feather/icons';

describe('Chat', () => {
	let component: Chat;
	let fixture: ComponentFixture<Chat>;

	const mockChatService = {
		messages$: new Subject<ChatMessage>(),
		connect: vi.fn().mockResolvedValue(null),
		currentUser: () => ({ userId: '1', username: 'TestUser' }),
		sendMessage: vi.fn(),
		activeUsers$: new Subject(),
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [Chat],
			providers: [
				{ provide: ChatService, useValue: mockChatService },
				importProvidersFrom(FeatherModule.pick(allIcons)),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Chat);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		// cannot read properties of undefined?
		expect(component).toBeTruthy();
	});
});
