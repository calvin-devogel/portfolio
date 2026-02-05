import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../services/notifications/notification-service';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [FeatherModule],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.scss',
})
export class NotificationToast {
  notificationService = inject(NotificationService);
}
