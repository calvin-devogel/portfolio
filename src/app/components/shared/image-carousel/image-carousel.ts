import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CarouselSlide {
  src: string;
  alt: string;
  caption?: string;
}

@Component({
  selector: 'app-image-carousel',
  imports: [CommonModule],
  templateUrl: './image-carousel.html',
  styleUrl: './image-carousel.scss',
})
export class ImageCarousel {
  slides = input.required<CarouselSlide[]>();
  label = input<string>('');
  private readonly ANIMATION_DURATION = 280;

  currentIndex = signal(0);
  animating = signal(false);
  direction = signal<'next' | 'prev'>('next');

  total = computed(() => this.slides.length);

  go(index: number) {
    if (this.animating() || index === this.currentIndex()) return;
    this.direction.set(index > this.currentIndex() ? 'next' : 'prev');
    this.animating.set(true);
    setTimeout(() => {
      this.currentIndex.set(index);
      this.animating.set(false);
    }, this.ANIMATION_DURATION);
  }

  prev() { this.go((this.currentIndex() - 1 + this.total()) % this.total()); }
  next() { this.go((this.currentIndex() + 1) % this.total()); }
}
