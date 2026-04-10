import { Component } from '@angular/core';
import { Footer } from '@app/shared/components/footer/footer';

@Component({
	selector: 'app-page-layout',
	imports: [Footer],
	templateUrl: './page-layout.html',
	styleUrl: './page-layout.scss',
})
export class PageLayout {}
