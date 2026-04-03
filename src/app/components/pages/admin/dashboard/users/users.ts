import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '@services/admin/user-service';
import { NotificationService } from '@services/notifications/notification-service';
import { UserData } from '@interfaces/user-data';
import { DashboardStatus } from '../../admin';

interface UsersPageState {
	status: DashboardStatus;
	users: UserData[] | null;
	errorText: string | null;
	inviteLink: string | null;
	inviteBusy: boolean;
	updatingRoleIds: Set<string>;
	resettingIds: Set<string>;
}

@Component({
	selector: 'app-users',
	imports: [CommonModule, FormsModule, FeatherModule],
	templateUrl: './users.html',
	styleUrl: './users.scss',
})
export class Users {
	private userService = inject(UserService);
	private notificationService = inject(NotificationService);
	private readonly destroyRef = inject(DestroyRef);

	inviteEmail = '';

	state = signal<UsersPageState>({
		status: 'loading',
		users: [],
		errorText: null,
		inviteLink: null,
		inviteBusy: false,
		updatingRoleIds: new Set(),
		resettingIds: new Set(),
	});

	status = computed(() => this.state().status);
	users = computed(() => this.state().users);
	inviteLink = computed(() => this.state().inviteLink);
	inviteBusy = computed(() => this.state().inviteBusy);

	readonly roleOptions: { value: UserData['role']; label: string }[] = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'user', label: 'User' },
		{ value: 'chat_user', label: 'Chat User' },
	];

	constructor() {
		this.loadUsers();
	}

	private patchState(patch: Partial<UsersPageState>): void {
		this.state.update((current) => ({ ...current, ...patch }));
	}

	loadUsers(): void {
		this.patchState({ status: 'loading', errorText: null });
		this.userService
			.getUsers()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (users) => {
					if (users === null) {
						this.patchState({ status: 'error', errorText: 'Failed to load users' });
						return;
					}
					this.patchState({ status: users.length ? 'ready' : 'empty', users });
				},
				error: () => {
					this.patchState({ status: 'error', errorText: 'Failed to load users' });
				},
			});
	}

	sendInvite(): void {
		const email = this.inviteEmail.trim();
		if (!email) {
			this.notificationService.error('Please enter a valid email address');
			return;
		}

		this.patchState({ inviteBusy: true, inviteLink: null });
		this.userService
			.createUser(email)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (response) => {
					if (!response?.success) {
						this.notificationService.error(
							response?.message || 'Failed to create invitation',
						);
						this.patchState({ inviteBusy: false });
						return;
					}
					this.inviteEmail = '';
					this.patchState({ inviteBusy: false, inviteLink: response.link });
					this.notificationService.success('Invitation created successfully');
				},
				error: () => {
					this.notificationService.error('Failed to create invitation');
					this.patchState({ inviteBusy: false });
				},
			});
	}

	clearInviteLink(): void {
		this.patchState({ inviteLink: null });
	}

	copyInviteLink(): void {
		const link = this.state().inviteLink;
		if (!link) {
			this.notificationService.error('No invite link to copy');
			return;
		}
		navigator.clipboard
			.writeText(link)
			.then(() => {
				this.notificationService.success('Invite link copied to clipboard');
			})
			.catch(() => {
				this.notificationService.error('Failed to copy invite link');
			});
	}

	isRoleUpdating(userId: string): boolean {
		return this.state().updatingRoleIds.has(userId);
	}

	isResetting(userId: string): boolean {
		return this.state().resettingIds.has(userId);
	}

	onRoleChange(user: UserData, event: Event): void {
		const role = (event.target as HTMLSelectElement).value as UserData['role'];
		if (role === user.role || this.isRoleUpdating(user.user_id)) return;

		const prev = user.role;
		const updatingIds = new Set(this.state().updatingRoleIds);
		updatingIds.add(user.user_id);

		this.patchState({
			updatingRoleIds: updatingIds,
			users:
				this.state().users?.map((u) => (u.user_id === user.user_id ? { ...u, role } : u)) ??
				null,
		});

		this.userService
			.setRole(user.user_id, role)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((success) => {
				const nextIds = new Set(this.state().updatingRoleIds);
				nextIds.delete(user.user_id);
				if (success) {
					this.patchState({ updatingRoleIds: nextIds });
					this.notificationService.success(`Role updated to ${role} successfully`);
				} else {
					this.patchState({
						updatingRoleIds: nextIds,
						users:
							this.state().users?.map((u) =>
								u.user_id === user.user_id ? { ...u, role: prev } : u,
							) ?? null,
					});
					this.notificationService.error(`Failed to update role to ${role}`);
				}
			});
	}

	resetPassword(user: UserData): void {
		if (this.isResetting(user.user_id)) return;

		const resettingIds = new Set(this.state().resettingIds);
		resettingIds.add(user.user_id);
		this.patchState({ resettingIds });

		this.userService
			.resetPassword(user.user_id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((success) => {
				const nextIds = new Set(this.state().resettingIds);
				nextIds.delete(user.user_id);
				this.patchState({ resettingIds: nextIds });
				if (success) {
					this.notificationService.success(`Password reset for ${user.username}.`);
					this.patchState({
						users: this.state().users?.map((u) =>
							u.user_id === user.user_id ? { ...u, must_change_password: true } : u,
						),
					});
				} else {
					this.notificationService.error(
						`Failed to reset password for ${user.username}.`,
					);
				}
			});
	}
}
