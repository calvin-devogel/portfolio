import { Component } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { Dashboard } from './dashboard/dashboard';

@Component({
  selector: 'app-admin',
  imports: [PageLayout, Dashboard],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {

}
