import {
	Component,
	Input,
	OnDestroy,
	OnInit,
	ChangeDetectionStrategy,
	signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { CarouselImage } from '@interfaces/blog-data';

@Component({
	selector: 'app-carousel',
	imports: [CommonModule, FeatherModule],
	templateUrl: './carousel.html',
	styleUrls: ['./carousel.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel implements OnInit, OnDestroy {
	@Input() slides: CarouselImage[] = [];
	@Input() label = '';
	@Input() autoPlayMs = 5000;

	currentIndex = signal(0);

	private timer?: ReturnType<typeof setInterval>;

	ngOnInit() {
		if (this.slides.length > 1 && this.autoPlayMs > 0) {
			this.timer = setInterval(() => {
				this.currentIndex.update((index) =>
					index < this.slides.length - 1 ? index + 1 : 0,
				);
			}, this.autoPlayMs);
		}
	}

	ngOnDestroy(): void {
		clearInterval(this.timer);
	}

	previous() {
		if (this.slides.length === 0) return;
		this.currentIndex.update((index) => Math.max(0, index - 1));
		this.resetTimer();
	}

	next() {
		if (this.slides.length === 0) return;
		this.currentIndex.update((index) => Math.min(this.slides.length - 1, index + 1));
		this.resetTimer();
	}

	goTo(index: number) {
		if (this.slides.length === 0) return;
		const clampedIndex = Math.max(0, Math.min(this.slides.length - 1, index));
		this.currentIndex.set(clampedIndex);
		this.resetTimer();
	}

	private resetTimer() {
		clearInterval(this.timer);
		if (this.slides.length > 1 && this.autoPlayMs > 0) {
			this.timer = setInterval(() => {
				this.currentIndex.update((index) =>
					index < this.slides.length - 1 ? index + 1 : 0,
				);
			}, this.autoPlayMs);
		}
	}
}
