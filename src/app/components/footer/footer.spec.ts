import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Footer } from './footer';

describe('Footer', () => {
	let component: Footer;
	let fixture: ComponentFixture<Footer>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [Footer],
			providers: [importProvidersFrom(FeatherModule.pick(allIcons))],
		}).compileComponents();

		fixture = TestBed.createComponent(Footer);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
