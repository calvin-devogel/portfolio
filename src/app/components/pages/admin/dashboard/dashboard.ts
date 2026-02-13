import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../../../services/contact/message-service';
import { MessageData } from '../../../../interfaces/message-data';
import { NotificationService } from '../../../../services/notifications/notification-service';
import { Subscription, interval, switchMap, startWith } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private messageService: MessageService = inject(MessageService);
  private notificationService: NotificationService = inject(NotificationService);

  messages = signal<MessageData[]>([]);
  currentPage = signal<number>(0);
  pageSize = signal<number>(20);
  totalCount = signal<number>(0);
  isLoading = signal<boolean>(false);

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages() - 1);
  hasPreviousPage = computed(() => this.currentPage() > 0);

  private subscription: Subscription = new Subscription();
  private readonly REFRESH_INTERVAL = 60000;

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private startAutoRefresh(): void {
    const sub = interval(this.REFRESH_INTERVAL).pipe(
      startWith(0),
      switchMap(() => {
        this.isLoading.set(true);
        return this.messageService.getMessages(this.currentPage(), this.pageSize());
      })
    ).subscribe({
      next: (response) => {
        this.messages.set(response.messages.map(message => ({
          message_id: message.message_id,
          sender_name: message.sender_name,
          email: message.email,
          message_text: message.message_text,
          created_at: message.created_at,
          read_message: message.read_message ?? false
        })));
        this.totalCount.set(response.total_count);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.error(
          'Failed to refresh messages. Please try again later.',
        );
      }
    });
    this.subscription.add(sub);
  }

  loadMessages(page: number = 0): void {
    this.isLoading.set(true);
    const sub = this.messageService.getMessages(page, this.pageSize()).subscribe({
      next: (response) => {
        this.messages.set(response.messages.map(message => ({
          message_id: message.message_id,
          sender_name: message.sender_name,
          email: message.email,
          message_text: message.message_text,
          created_at: message.created_at,
          read_message: message.read_message ?? false
        })));
        this.totalCount.set(response.total_count);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.error(
          'Failed to load messages. Please try again later.',
        );
      }
    })
    this.subscription.add(sub);
  }

  markAsRead(message: MessageData): void {
    if (message.read_message) {
      return;
    }

    const sub = this.messageService.patchMessage(message.message_id, true).subscribe({
      next: () => {
        this.messages.update(messages => 
          messages.map(m =>
            m.message_id === message.message_id
            ? { ...m, read_message: true }
            :m
          )
        );
      },
      error: (error) => {
        this.notificationService.error(
          'Failed to mark messages as read. Please try again later.',
        );
      }
    });
    this.subscription.add(sub);
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
