import { Component } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-projects',
  imports: [PageLayout, FeatherModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {

}
