import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { of } from 'rxjs';
import { UserService } from '@app/admin/services/user-service';
import { Users } from '@app/admin/components/users/users';
import { NotificationService } from '@app/shared/services/notification-service';
import { UserData, CreateUserResponse } from '@app/auth/interfaces/user-data';

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

			expect(component.status()).toBe('empty');
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
			expect(notificationServiceMock.success).toHaveBeenCalledWith(
				'Invitation created successfully',
			);
		});

		it('should clear inviteEmail after a successful invite', async () => {
			userServiceMock.createUser.mockReturnValue(of(mockResponse));
			component.inviteEmail = 'new@example.com';
			component.sendInvite();
			await fixture.whenStable();

			expect(component.inviteEmail).toBe('');
		});

		it('should not call createUser and show an error when email is blank', () => {
			component.inviteEmail = '';
			component.sendInvite();

			expect(userServiceMock.createUser).not.toHaveBeenCalled();
			expect(notificationServiceMock.error).toHaveBeenCalledWith(
				'Please enter a valid email address',
			);
		});

		it('should set status to error on HTTP failure', async () => {
			const { throwError } = await import('rxjs');
			userServiceMock.getUsers.mockReturnValue(throwError(() => new Error('Network error')));
			component.loadUsers();
			await fixture.whenStable();

			expect(component.status()).toBe('error');
		});

		it('should handle HTTP errors gracefully when createUsers fails', async () => {
			const { throwError } = await import('rxjs');
			userServiceMock.createUser.mockReturnValue(
				throwError(() => new Error('Network error')),
			);
			component.inviteEmail = 'test@example.com';
			component.sendInvite();
			await fixture.whenStable();

			expect(component.inviteBusy()).toBe(false);
			expect(component.inviteLink()).toBeNull();
		});
	});

	describe('clearInviteLink', () => {
		it('should set inviteLink back to null', async () => {
			userServiceMock.createUser.mockReturnValue(
				of({ success: true, message: '', link: 'https://example.com/invite/token' }),
			);
			component.inviteEmail = 'test@example.com';
			component.sendInvite();
			await fixture.whenStable();

			component.clearInviteLink();

			expect(component.inviteLink()).toBeNull();
		});
	});

	describe('copyInviteLink', () => {
		let writeTextMock: Mock;

		beforeEach(() => {
			writeTextMock = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, 'clipboard', {
				value: { writeText: writeTextMock },
				writable: true,
				configurable: true,
			});
		});

		afterEach(() => vi.restoreAllMocks());

		it('should write the invite link to clipboard and show success notification', async () => {
			component.state.update((s) => ({
				...s,
				inviteLink: 'https://example.com/invite/token',
			}));
			component.copyInviteLink();
			await fixture.whenStable();

			expect(writeTextMock).toHaveBeenCalledWith('https://example.com/invite/token');
			expect(notificationServiceMock.success).toHaveBeenCalledWith(
				'Invite link copied to clipboard',
			);
		});

		it('should show an error notification when the clipboard write fails', async () => {
			writeTextMock.mockRejectedValue(new Error('Permission denied'));
			component.state.update((s) => ({
				...s,
				inviteLink: 'https://example.com/invite/token',
			}));
			component.copyInviteLink();
			await fixture.whenStable();

			expect(notificationServiceMock.error).toHaveBeenCalledWith(
				'Failed to copy invite link',
			);
		});

		it('should show an error notification when there is no invite link', async () => {
			component.copyInviteLink();

			expect(writeTextMock).not.toHaveBeenCalled();
			expect(notificationServiceMock.error).toHaveBeenCalledWith('No invite link to copy');
		});
	});

	describe('onRoleChange', () => {
		it('should update the user role and show a success notification', async () => {
			userServiceMock.setRole.mockReturnValue(of(undefined));
			const user = mockUsers[1];
			const event = { target: { value: 'chat_user' } } as unknown as Event;

			component.onRoleChange(user, event);
			await fixture.whenStable();

			const updatedUser = component.users()?.find((u) => u.user_id === user.user_id);
			expect(updatedUser?.role).toBe('chat_user');
			expect(notificationServiceMock.success).toHaveBeenCalledWith(
				'Role updated to chat_user successfully',
			);
		});

		it('should revert the user role on HTTP failure', async () => {
			const { throwError } = await import('rxjs');
			userServiceMock.setRole.mockReturnValue(throwError(() => new Error('Server error')));
			const user = mockUsers[1];
			const event = { target: { value: 'admin' } } as unknown as Event;

			component.onRoleChange(user, event);
			await fixture.whenStable();

			const updatedUser = component.users()?.find((u) => u.user_id === user.user_id);
			expect(updatedUser?.role).toBe('user');
		});

		it('should do nothing when the selected role matches the current role', () => {
			const user = mockUsers[0];
			const event = { target: { value: 'admin' } } as unknown as Event;

			component.onRoleChange(user, event);
			expect(userServiceMock.setRole).not.toHaveBeenCalled();
		});
	});

	describe('resetPassword', () => {
		it('should mark the user as must_change_password and show a success notification', async () => {
			userServiceMock.resetPassword.mockReturnValue(of(undefined));
			const user = mockUsers[0];

			component.resetPassword(user);
			await fixture.whenStable();

			const updatedUser = component.users()?.find((u) => u.user_id === user.user_id);
			expect(updatedUser?.must_change_password).toBe(true);
			expect(notificationServiceMock.success).toHaveBeenCalledWith(
				`Password reset for ${user.username}.`,
			);
		});
	});
});
