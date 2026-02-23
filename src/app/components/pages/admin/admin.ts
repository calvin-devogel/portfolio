import { Component } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { Dashboard } from './dashboard/dashboard';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-admin',
  imports: [Dashboard, FeatherModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {

}
