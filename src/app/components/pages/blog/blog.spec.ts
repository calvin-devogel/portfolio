import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Blog } from './blog';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Blog', () => {
	let component: Blog;
	let fixture: ComponentFixture<Blog>;

	beforeEach(async () => {
		vi.stubGlobal(
			'IntersectionObserver',
			vi.fn(function () {
				return {
					observe: vi.fn(),
					unobserve: vi.fn(),
					disconnect: vi.fn(),
				};
			}),
		);

		await TestBed.configureTestingModule({
			imports: [Blog],
			providers: [
				importProvidersFrom(FeatherModule.pick(allIcons)),
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Blog);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	afterEach(() => vi.unstubAllGlobals());

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
