import { Component } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [PageLayout, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {

}
