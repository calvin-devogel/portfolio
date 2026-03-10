import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { provideRouter } from '@angular/router';
import { BlogIndividual } from './blog-individual';

describe('BlogIndividual', () => {
	let component: BlogIndividual;
	let fixture: ComponentFixture<BlogIndividual>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BlogIndividual],
			providers: [importProvidersFrom(FeatherModule.pick(allIcons)), provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(BlogIndividual);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
