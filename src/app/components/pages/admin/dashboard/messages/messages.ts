import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '@services/contact/message-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageData } from '@interfaces/message-data';
import { NotificationService } from '@services/notifications/notification-service';
import { DashboardStatus } from '@components/pages/admin/admin';
import { interval } from 'rxjs';
import { startWith } from 'rxjs/operators';

interface MesagePageState {
	status: DashboardStatus;
	messages: MessageData[];
	currentPage: number;
	pageSize: number;
	totalCount: number;
	errorText: string | null;
	updatingIds: Set<string>;
	refreshing: boolean;
}

// this needs a re-work. The auto-refresh is clunky, and the message_read status is only updated on click, without
// accounting for whether or not the database has completed the update.
@Component({
	selector: 'app-messages',
	imports: [CommonModule],
	templateUrl: './messages.html',
	styleUrl: './messages.scss',
})
export class Messages {
	private messageService: MessageService = inject(MessageService);
	private notificationService: NotificationService = inject(NotificationService);
	private readonly destroyRef: DestroyRef = inject(DestroyRef);
	private readonly REFRESH_INTERVAL = 60000;

	state = signal<MesagePageState>({
		status: 'idle',
		messages: [],
		currentPage: 0,
		pageSize: 20,
		totalCount: 0,
		errorText: null,
		updatingIds: new Set<string>(),
		refreshing: false,
	});

	status = computed(() => this.state().status);
	messages = computed(() => this.state().messages);
	currentPage = computed(() => this.state().currentPage);
	totalPages = computed(() => {
		const { totalCount, pageSize } = this.state();
		if (!Number.isFinite(totalCount) || !Number.isFinite(pageSize) || pageSize <= 0) return 1;
		return Math.max(1, Math.ceil(totalCount / pageSize));
	});
	hasNextPage = computed(() => this.currentPage() < this.totalPages());
	hasPreviousPage = computed(() => this.currentPage() > 0);
	isBusy = computed(() => this.state().status === 'loading' || this.state().refreshing);

	constructor() {
		this.loadMessages(0);
		this.startAutoRefresh();
	}

	private patchState(patch: Partial<MesagePageState>): void {
		this.state.update((state) => ({ ...state, ...patch }));
	}

	private startAutoRefresh(): void {
		interval(this.REFRESH_INTERVAL)
			.pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.loadMessages(this.currentPage(), true));
	}

	loadMessages(page = 0, background = false): void {
		const initial = this.state().messages.length === 0 && !background;

		this.patchState({
			status: initial ? 'loading' : this.state().status,
			refreshing: background,
			errorText: null,
		});

		this.messageService
			.getMessages(page, this.state().pageSize)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (response) => {
					const normalized = response.messages.map((message) => ({
						...message,
						read_message: message.read_message ?? false,
					}));

					this.patchState({
						messages: normalized,
						totalCount: response.total_items,
						currentPage: page,
						status: normalized.length ? 'ready' : 'empty',
						refreshing: false,
						errorText: null,
					});
				},
				error: () => {
					this.patchState({
						status: 'error',
						refreshing: false,
						errorText: 'Failed to load messages. Please try again.',
					});
					this.notificationService.error('Failed to load messages.');
				},
			});
	}

	markAsRead(message: MessageData): void {
		const id = message.message_id;
		const s = this.state();

		if (message.read_message || s.updatingIds.has(id)) return;

		// optimistic update
		const optimisticSet = new Set(s.updatingIds);
		optimisticSet.add(id);

		this.patchState({
			updatingIds: optimisticSet,
			messages: s.messages.map((m) =>
				m.message_id === id ? { ...m, read_message: true } : m,
			),
		});

		this.messageService
			.patchMessage(id, true)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					const nextSet = new Set(this.state().updatingIds);
					nextSet.delete(id);
					this.patchState({ updatingIds: nextSet });
				},
				error: () => {
					// rollback
					const nextSet = new Set(this.state().updatingIds);
					nextSet.delete(id);
					this.patchState({
						updatingIds: nextSet,
						messages: this.state().messages.map((m) =>
							m.message_id === id ? { ...m, read_message: false } : m,
						),
					});
					this.notificationService.error('Failed to update message status.');
				},
			});
	}

	isMessageUpdating(messageId: string): boolean {
		return this.state().updatingIds.has(messageId);
	}

	nextPage(): void {
		if (this.hasNextPage()) {
			this.loadMessages(this.currentPage() + 1);
		}
	}

	previousPage(): void {
		if (this.hasPreviousPage()) {
			this.loadMessages(this.currentPage() - 1);
		}
	}

	trackByMessageId(_index: number, item: MessageData): string {
		return item.message_id;
	}

	formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
}
