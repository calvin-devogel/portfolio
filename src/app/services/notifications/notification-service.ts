import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  public notifications$ = this.notifications.asReadonly();

  show(message: string, type: Notification['type'] = 'info', duration = 5000) {
    const id = crypto.randomUUID();
    const notification = { id, message, type };

    this.notifications.update(notifs => [...notifs, notification]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: string) {
    this.notifications.update(notifs => notifs.filter(n => n.id !== id));
  }

  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  info(message: string, duration = 4000) {
    this.show(message, 'info', duration);
  }
}
