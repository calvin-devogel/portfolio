import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from './components/nav/nav';
import { NotificationToast } from "./components/notification-toast/notification-toast/notification-toast";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, NotificationToast],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('portfolio');
}
