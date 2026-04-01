import { ComponentFixture, TestBed } from "@angular/core/testing";
import { importProvidersFrom } from "@angular/core";
import { FeatherModule } from "angular-feather";
import { allIcons } from "angular-feather/icons";
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { of } from 'rxjs';
import { UserService } from "@services/admin/user-service";
import { Users } from "./users";
import { NotificationService } from "@services/notifications/notification-service";
import { UserData, CreateUserResponse } from "@interfaces/user-data";

const mockUsers: UserData[] = [
	{ user_id: '1', username: 'alice', role: 'admin', must_change_password: false },
	{ user_id: '2', username: 'bob', role: 'user', must_change_password: true },
];

describe('Users', () => {
	let component: Users;
	let fixture: ComponentFixture<Users>;
	let userServiceMock: { getUsers: Mock; createUser: Mock; setRole: Mock; resetPassword: Mock };
	let notificationServiceMock: { error: Mock; success: Mock };

	beforeEach(async () => {
		userServiceMock = {
			getUsers: vi.fn(() => of(mockUsers)),
			createUser: vi.fn(),
			setRole: vi.fn(),
			resetPassword: vi.fn(),
		};

		notificationServiceMock = {
			error: vi.fn(),
			success: vi.fn(),
		};

		await TestBed.configureTestingModule({
			imports: [Users],
			providers: [
				importProvidersFrom(FeatherModule.pick(allIcons)),
				{ provide: UserService, useValue: userServiceMock },
				{ provide: NotificationService, useValue: notificationServiceMock },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Users);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('loadUsers', () => {
		it('should set status to ready and populate users on success', () => {
			expect(component.status()).toBe('ready');
			expect(component.users()).toEqual(mockUsers);
		});

		it('should set status to empty when an empty users array is returned', async () => {
			userServiceMock.getUsers.mockReturnValue(of([]));
			component.loadUsers();
			await fixture.whenStable();

			expect(component.status()).toBe('empty');
			expect(component.users()).toEqual([]);
		});

		it('should set status to error when getUsers returns null', async () => {
			userServiceMock.getUsers.mockReturnValue(of(null));
			component.loadUsers();
			await fixture.whenStable();

			expect(component.status()).toBe('error');
			expect(component.users()).toBeNull();
		});
	});

	describe('sendInvite', () => {
		const mockResponse: CreateUserResponse = {
			success: true,
			message: 'Invitation created',
			link: 'https://example.com/invite/token',
		};

		it('should set inviteLink and show success notification on successful invite', async () => {
			userServiceMock.createUser.mockReturnValue(of(mockResponse));
			component.inviteEmail = 'new@example.com';
			component.sendInvite();
			await fixture.whenStable();

			expect(component.inviteLink()).toBe(mockResponse.link);
			expect(notificationServiceMock.success).toHaveBeenCalledWith('Invitation created successfully');
		});
	});
});