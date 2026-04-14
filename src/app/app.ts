import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Nav } from '@app/shared/components/nav/nav';
import { NotificationToast } from '@app/shared/components/notification-toast/notification-toast/notification-toast';
import { MarkdownModule } from 'ngx-markdown';
import { MetricsService } from '@app/shared/services/metrics-service';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, Nav, NotificationToast, MarkdownModule],
	templateUrl: './app.html',
	styleUrls: ['./app.scss'],
})
export class App {
	private router = inject(Router);
	private metricsService = inject(MetricsService);
	readonly title = signal('portfolio');
	isNavigating = signal(false);

	constructor() {
		this.metricsService.collectWebVitals();
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationStart) {
				this.isNavigating.set(true);
			} else if (event instanceof NavigationEnd) {
				this.isNavigating.set(false);
			}
		});
	}
}
