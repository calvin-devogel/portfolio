import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-content-card',
	imports: [CommonModule],
	templateUrl: './content-card.html',
	styleUrl: './content-card.scss',
})
export class ContentCard {
	@Input({ required: true }) title!: string;
	@Input() ariaLabelledBy = 'section-heading';
	@Input() boxClasses = 'mt-6 py-6 px-6';
	@Input() titleClasses = 'title is-3 mb-4';
}
