import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { ResumeData, SkillGroup } from '../../../interfaces/resume-data';
import { ResumeService } from '../../../services/resume/resume-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs'
import { NotificationService } from '../../../services/notifications/notification-service';
import { FeatherModule } from 'angular-feather';
import { SeoService } from '../../../services/seo-service';
import { resumeSchema, personSchema } from '../../../modules/structured-data.schemas.ts/structured-data.schemas.ts-module';

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
      })
    )
  );

  private transformData(data: ResumeData): ResumeData {
    const formatDate = (dateStr?: string): string => {
      if (!dateStr) return 'Present';
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC'});
    };

    const getSkillTags = (details: string): string[] => {
      return details ? details.split(',').map(tag => tag.trim()) : [];
    }

    // transform skill tags
    data.cv.sections.skills.forEach((skillGroup: SkillGroup) => {
      skillGroup['tags'] = getSkillTags(skillGroup.details);
    })

    // transform experience dates
    data.cv.sections.experience.forEach((job: any) => {
      job.start_date = formatDate(job.start_date);
      job.end_date = formatDate(job.end_date);
    });

    // transform education dates
    data.cv.sections.education.forEach((edu: any) => {
      edu.end_date = formatDate(edu.end_date);
    })

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
