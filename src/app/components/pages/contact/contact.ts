import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayout } from '../../page-layout/page-layout';
import { FeatherModule } from "angular-feather";
import { IconsModule } from '../../../modules/icons/icons-module';

@Component({
  selector: 'app-contact',
  imports: [PageLayout, CommonModule, IconsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {

}
