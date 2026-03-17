import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Nav } from './nav';
import { ActivatedRoute } from '@angular/router';

describe('Nav', () => {
	let component: Nav;
	let fixture: ComponentFixture<Nav>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [Nav],
			providers: [
				importProvidersFrom(FeatherModule.pick(allIcons)),
				{ provide: ActivatedRoute, useValue: { snapshot: { url: [{ path: '' }] } } },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Nav);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
