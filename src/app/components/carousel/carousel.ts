import { 
  Component,
  Input,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
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
export class Carousel implements OnInit, OnDestroy{
  @Input() slides: CarouselImage[] = [];
  @Input() label: string = '';
  @Input() autoPlayMs = 5000;

  currentIndex = signal(0);

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    if (this.slides.length > 1 && this.autoPlayMs > 0) {
      this.timer = setInterval(() => {
        this.currentIndex.update(index =>
          index < this.slides.length - 1 ? index + 1 : 0
        );
      }, this.autoPlayMs);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  previous() {
    this.currentIndex.update(index => Math.max(0, index - 1));
    this.resetTimer();
  }

  next() {
    this.currentIndex.update(index => Math.min(this.slides.length - 1, index + 1));
    this.resetTimer();
  }

  goTo(index: number) {
    this.currentIndex.set(index);
    this.resetTimer();
  }

  private resetTimer() {
    clearInterval(this.timer);
    if (this.slides.length > 1 && this.autoPlayMs > 0) {
      this.timer = setInterval(() => {
        this.currentIndex.update(index =>
          index < this.slides.length - 1 ? index + 1 : 0
        );
      }, this.autoPlayMs);
    }
  }
}
