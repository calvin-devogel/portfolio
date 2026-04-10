import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Carousel } from '@app/shared/components/carousel/carousel';
import { CarouselImage } from '@app/blog/interfaces/blog-data';
import { vi } from 'vitest';

describe('Carousel', () => {
	let component: Carousel;
	let fixture: ComponentFixture<Carousel>;

	const slides = [
		{ src: 'a.jpg', alt: 'A' },
		{ src: 'b.jpg', alt: 'B' },
		{ src: 'c.jpg', alt: 'C' },
	] as CarouselImage[];

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [Carousel],
			providers: [importProvidersFrom(FeatherModule.pick(allIcons))],
		}).compileComponents();

		fixture = TestBed.createComponent(Carousel);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	describe('autoPlay', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('advances the index after each autoPlayMs interval and wraps correctly', () => {
			component.slides = slides;
			component.autoPlayMs = 3000;
			component.ngOnInit();

			expect(component.currentIndex()).toBe(0);

			vi.advanceTimersByTime(3000);
			expect(component.currentIndex()).toBe(1);

			vi.advanceTimersByTime(3000);
			expect(component.currentIndex()).toBe(2);

			vi.advanceTimersByTime(3000);
			expect(component.currentIndex()).toBe(0);
		});
	});

	describe('controls', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('previous() decreases the index but does not go below 0', () => {
			component.slides = slides;
			component.currentIndex.set(1);
			component.previous();
			expect(component.currentIndex()).toBe(0);
			component.previous();
			expect(component.currentIndex()).toBe(0);
		});

		it('next() increases the index but does not go above slides.length - 1', () => {
			component.slides = slides;
			component.currentIndex.set(1);
			component.next();
			expect(component.currentIndex()).toBe(2);
			component.next();
			expect(component.currentIndex()).toBe(2);
		});

		it('goTo() sets the index to the specified value within bounds', () => {
			component.slides = slides;
			component.goTo(1);
			expect(component.currentIndex()).toBe(1);
			component.goTo(-5);
			expect(component.currentIndex()).toBe(0);
			component.goTo(10);
			expect(component.currentIndex()).toBe(2);
		});

		it('should return early if slides is empty', () => {
			component.slides = [];
			component.previous();
			expect(component.currentIndex()).toBe(0);
			component.next();
			expect(component.currentIndex()).toBe(0);
			component.goTo(1);
			expect(component.currentIndex()).toBe(0);
			component.goTo(-1);
			expect(component.currentIndex()).toBe(0);
			component.goTo(10);
			expect(component.currentIndex()).toBe(0);
		});

		it('resets the timer on manual navigation', () => {
			component.slides = slides;
			component.autoPlayMs = 3000;
			component.ngOnInit();

			vi.advanceTimersByTime(2000);
			component.next();
			expect(component.currentIndex()).toBe(1);

			vi.advanceTimersByTime(2000);
			expect(component.currentIndex()).toBe(1);

			vi.advanceTimersByTime(1000);
			expect(component.currentIndex()).toBe(2);
		});
	});

	describe('template', () => {
		it('should render the correct number of slides', () => {
			fixture.componentRef.setInput('slides', slides);
			fixture.detectChanges();
			const slideElements = fixture.nativeElement.querySelectorAll('.carousel-slide');
			expect(slideElements.length).toBe(3);
		});

		it('renders the label when provided', () => {
			fixture.componentRef.setInput('label', 'Test Carousel');
			fixture.detectChanges();
			const labelElement = fixture.nativeElement.querySelector('.carousel-label');
			expect(labelElement).toBeTruthy();
			expect(labelElement.textContent).toContain('Test Carousel');
		});

		it('omits the label element when label is empty', () => {
			fixture.componentRef.setInput('label', '');
			fixture.detectChanges();
			const labelElement = fixture.nativeElement.querySelector('.carousel-label');
			expect(labelElement).toBeNull();
		});

		it('marks only the current slide as active', () => {
			fixture.componentRef.setInput('slides', slides);
			component.currentIndex.set(1);
			fixture.detectChanges();

			const slideElements = fixture.nativeElement.querySelectorAll('.carousel-slide');
			expect(slideElements[0].classList.contains('is-active')).toBeFalsy();
			expect(slideElements[1].classList.contains('is-active')).toBeTruthy();
			expect(slideElements[2].classList.contains('is-active')).toBeFalsy();
		});

		it('renders a figcaption when a slide has a caption', () => {
			const slideWithCaption = { src: 'd.jpg', alt: 'D', caption: 'Caption D' };
			fixture.componentRef.setInput('slides', [...slides, slideWithCaption]);
			fixture.detectChanges();

			const captionElement = fixture.nativeElement.querySelector(
				'.carousel-slide figcaption',
			);
			expect(captionElement).toBeTruthy();
			expect(captionElement.textContent).toContain('Caption D');
		});

		it('omits figcaption when a slide does not have a caption', () => {
			fixture.componentRef.setInput('slides', slides);
			fixture.detectChanges();

			const captionElement = fixture.nativeElement.querySelector(
				'.carousel-slide figcaption',
			);
			expect(captionElement).toBeNull();
		});

		it('hides arrows and dots for a single slide', () => {
			fixture.componentRef.setInput('slides', [slides[0]]);
			fixture.detectChanges();

			const arrowElements = fixture.nativeElement.querySelectorAll('.carousel-arrow');
			const dotElements = fixture.nativeElement.querySelectorAll('.carousel-dot');
			expect(arrowElements.length).toBe(0);
			expect(dotElements.length).toBe(0);
		});

		it('shows arrows and dots for multiple slides', () => {
			fixture.componentRef.setInput('slides', slides);
			fixture.detectChanges();

			const arrowElements = fixture.nativeElement.querySelectorAll('.carousel-arrow');
			const dotElements = fixture.nativeElement.querySelectorAll('.carousel-dot');
			expect(arrowElements.length).toBe(2);
			expect(dotElements.length).toBe(3);
		});

		it('disables the previous button at the first slide and next button at the last slide', () => {
			fixture.componentRef.setInput('slides', slides);
			component.currentIndex.set(0);
			fixture.detectChanges();
			let prevButton = fixture.nativeElement.querySelector('.carousel-arrow--prev');
			let nextButton = fixture.nativeElement.querySelector('.carousel-arrow--next');
			expect(prevButton.disabled).toBeTruthy();
			expect(nextButton.disabled).toBeFalsy();

			component.currentIndex.set(2);
			fixture.detectChanges();
			prevButton = fixture.nativeElement.querySelector('.carousel-arrow--prev');
			nextButton = fixture.nativeElement.querySelector('.carousel-arrow--next');
			expect(prevButton.disabled).toBeFalsy();
			expect(nextButton.disabled).toBeTruthy();
		});

		it('marks the dot at currentIndex as active', () => {
			fixture.componentRef.setInput('slides', slides);
			component.currentIndex.set(1);
			fixture.detectChanges();

			const dotElements = fixture.nativeElement.querySelectorAll('.carousel-dot');
			expect(dotElements[0].classList.contains('is-active')).toBeFalsy();
			expect(dotElements[1].classList.contains('is-active')).toBeTruthy();
			expect(dotElements[2].classList.contains('is-active')).toBeFalsy();
		});

		it('clicking the next arrow advances to the next slide', () => {
			fixture.componentRef.setInput('slides', slides);
			fixture.detectChanges();

			const nextButton = fixture.nativeElement.querySelector('.carousel-arrow--next');
			nextButton.click();
			fixture.detectChanges();
			expect(component.currentIndex()).toBe(1);
		});

		it('clicking the previous arrow goes to the previous slide', () => {
			fixture.componentRef.setInput('slides', slides);
			component.currentIndex.set(1);
			fixture.detectChanges();

			const prevButton = fixture.nativeElement.querySelector('.carousel-arrow--prev');
			prevButton.click();
			fixture.detectChanges();
			expect(component.currentIndex()).toBe(0);
		});

		it('clicking a dot goes to the corresponding slide', () => {
			fixture.componentRef.setInput('slides', slides);
			fixture.detectChanges();
			const dotElements = fixture.nativeElement.querySelectorAll('.carousel-dot');
			dotElements[2].click();
			fixture.detectChanges();
			expect(component.currentIndex()).toBe(2);
		});
	});
});
