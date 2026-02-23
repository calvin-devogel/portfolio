import { Component } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { RouterLink } from "@angular/router";
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-home',
  imports: [PageLayout, RouterLink, FeatherModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {

}
