import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconsModule } from '../../modules/icons/icons-module';

@Component({
  selector: 'app-nav',
  imports: [IconsModule, RouterLink],
  templateUrl: './nav.html',
  styleUrls: ['./nav.scss'],
})
export class Nav {

}
