import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Nav } from './components/nav/nav';
import { NotificationToast } from './components/notification-toast/notification-toast/notification-toast';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, NotificationToast, MarkdownModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  private router = inject(Router);
  readonly title = signal('portfolio');
  isNavigating = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
      } else if (event instanceof NavigationEnd) {
        this.isNavigating.set(false);
      }
    });
  }
}
