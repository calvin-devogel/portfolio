import { Component, inject, OnInit } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { RouterLink } from "@angular/router";
import { FeatherModule } from 'angular-feather';
import { SeoService } from '../../../services/seo-service';
import { homeSchema, personSchema } from '../../../modules/structured-data.schemas.ts/structured-data.schemas.ts-module';

@Component({
  selector: 'app-home',
  imports: [PageLayout, RouterLink, FeatherModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'Calvin de Vogel | Portfolio',
      description: "Hi, I'm Cal, a software engineer specializing in full-stack, cloud-native application development. Welcome to my portfolio, where I showcase my projects, experience, and passion for software development.",
      canonicalUrl: 'https://devogel.dev',
      ogType: 'website',
      structuredData: [homeSchema, personSchema],
    });
  }
}
