import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { PageLayout } from '@app/shared/components/page-layout/page-layout';
import { Education, Experience, ResumeData, SkillGroup } from '../../interfaces/resume-data';
import { ResumeService } from '@app/resume/services/resume-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';
import { NotificationService } from '@app/shared/services/notification-service';
import { FeatherModule } from 'angular-feather';
import { SeoService } from '@app/shared/services/seo-service';
import {
	resumeSchema,
	personSchema,
} from '@app/shared/schemas/structured-data.schemas';

@Component({
	selector: 'app-resume',
	imports: [PageLayout, FeatherModule],
	templateUrl: './resume.html',
	styleUrls: ['./resume.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Resume implements OnInit {
	private resumeService = inject(ResumeService);
	private notificationService = inject(NotificationService);
	private seoService = inject(SeoService);

	isLoading = signal(true);
	hasError = signal(false);

	resumeData = toSignal(
		this.resumeService.getResumeData().pipe(
			tap(() => this.isLoading.set(false)),
			map((data) => this.transformData(data)),
			catchError((error) => {
				this.isLoading.set(false);
				this.hasError.set(true);
				this.notificationService.error('Failed to load resume data.');
				console.error('Error fetching resume data:', error);
				return of(null);
			}),
		),
	);

	private transformData(data: ResumeData): ResumeData {
		const formatDate = (dateStr?: string): string => {
			if (!dateStr) return 'Present';
			return new Date(dateStr).toLocaleDateString('en-US', {
				month: 'short',
				year: 'numeric',
				timeZone: 'UTC',
			});
		};

		const getSkillTags = (details: string): string[] => {
			return details ? details.split(',').map((tag) => tag.trim()) : [];
		};

		// transform skill tags
		data.cv.sections.skills.forEach((skillGroup: SkillGroup) => {
			skillGroup['tags'] = getSkillTags(skillGroup.details);
		});

		// transform experience dates
		data.cv.sections.experience.forEach((job: Experience) => {
			job.start_date = formatDate(job.start_date);
			job.end_date = formatDate(job.end_date);
		});

		// transform education dates
		data.cv.sections.education.forEach((edu: Education) => {
			edu.end_date = formatDate(edu.end_date);
		});

		return data;
	}

	ngOnInit(): void {
		this.seoService.updateSeo({
			title: 'Calvin de Vogel | Resume',
			description: 'View my professional experience, skills, and education.',
			canonicalUrl: 'https://devogel.dev/resume',
			ogTitle: 'Calvin de Vogel | Resume',
			ogType: 'website',
			structuredData: [resumeSchema, personSchema],
		});
	}
}
