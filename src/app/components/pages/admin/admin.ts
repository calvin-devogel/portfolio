import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export type DashboardStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FeatherModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
})
export class Admin {

}
