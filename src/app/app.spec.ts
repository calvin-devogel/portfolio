import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { App } from './app';

describe('App', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [App],
			providers: [importProvidersFrom(FeatherModule.pick(allIcons)), provideRouter([])],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should render title', async () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect((app as App).title()).toBe('portfolio');
	});
});
