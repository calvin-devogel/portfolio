import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { PageLayout } from '@app/shared/components/page-layout/page-layout';
import { RouterLink } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { SeoService } from '@app/shared/services/seo-service';
import { Contact } from '@app/contact/components/contact/contact';
import { homeSchema, personSchema } from '@app/shared/schemas/structured-data.schemas';

@Component({
	selector: 'app-home',
	imports: [PageLayout, RouterLink, FeatherModule, Contact],
	templateUrl: './home.html',
	styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
	private seoService = inject(SeoService);

	ngOnInit(): void {
		this.seoService.updateSeo({
			title: 'Calvin de Vogel | Portfolio',
			description:
				"Hi, I'm Cal, a software engineer specializing in full-stack, cloud-native application development. Welcome to my portfolio, where I showcase my projects, experience, and passion for software development.",
			canonicalUrl: 'https://devogel.dev',
			ogType: 'website',
			structuredData: [homeSchema, personSchema],
		});
	}

	@ViewChild('contactModal') contactModal!: Contact;

	openContactModal(): void {
		this.contactModal.openModal();
	}
}
