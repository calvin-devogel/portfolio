import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayout } from '../../page-layout/page-layout';

@Component({
  selector: 'app-home',
  imports: [PageLayout, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {

}
