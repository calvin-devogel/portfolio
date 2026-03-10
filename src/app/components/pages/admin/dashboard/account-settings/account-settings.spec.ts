import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { AccountSettings } from './account-settings';

describe('AccountSettings', () => {
	let component: AccountSettings;
	let fixture: ComponentFixture<AccountSettings>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AccountSettings],
			providers: [importProvidersFrom(FeatherModule.pick(allIcons))],
		}).compileComponents();

		fixture = TestBed.createComponent(AccountSettings);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
