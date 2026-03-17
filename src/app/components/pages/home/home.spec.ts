import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Home } from './home';
import { provideRouter } from '@angular/router';

describe('Home', () => {
	let component: Home;
	let fixture: ComponentFixture<Home>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [Home],
			providers: [importProvidersFrom(FeatherModule.pick(allIcons)), provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(Home);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('openContactModal', () => {
		it('should open the contact modal', () => {
			vi.spyOn(component.contactModal, 'openModal');
			component.openContactModal();
			expect(component.contactModal.openModal).toHaveBeenCalled();
		});
	});
});
