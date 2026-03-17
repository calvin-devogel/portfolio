import { Component, inject, OnInit } from '@angular/core';
import { PageLayout } from '@components/page-layout/page-layout';
import { FeatherModule } from 'angular-feather';
import { SeoService } from '@services/seo/seo-service';
import {
	projectsSchema,
	personSchema,
} from '@modules/structured-data.schemas.ts/structured-data.schemas.ts-module';

@Component({
	selector: 'app-projects',
	imports: [PageLayout, FeatherModule],
	templateUrl: './projects.html',
	styleUrls: ['./projects.scss'],
})
export class Projects implements OnInit {
	private seoService = inject(SeoService);

	ngOnInit(): void {
		this.seoService.updateSeo({
			title: 'Calvin de Vogel | Projects',
			description: 'Check out some of my projects to see my areas of interest and my skills.',
			canonicalUrl: 'https://devogel.dev/projects',
			ogTitle: 'Calvin de Vogel | Projects',
			ogType: 'website',
			structuredData: [projectsSchema, personSchema],
		});
	}
}
