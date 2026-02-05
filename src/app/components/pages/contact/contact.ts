import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayout } from '../../page-layout/page-layout';
import { FeatherModule } from "angular-feather";

@Component({
  selector: 'app-contact',
  imports: [PageLayout, CommonModule, FeatherModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {

}
