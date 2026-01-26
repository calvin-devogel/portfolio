import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { ResumeData, SkillGroup } from '../../../interfaces/resume-data';
import { ResumeService } from '../../../services/resume-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs'

@Component({
  selector: 'app-resume',
  imports: [PageLayout],
  templateUrl: './resume.html',
  styleUrls: ['./resume.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Resume {
  private resumeService = inject(ResumeService);

  resumeData = toSignal(
    this.resumeService.getResumeData().pipe(
      map((data) => this.transformData(data)),
      catchError((error) => {
        console.error('Error fetching resume data:', error);
        return of(null);
      })
    )
  );

  private transformData(data: ResumeData): ResumeData {
    const formatDate = (dateStr?: string): string => {
      if (!dateStr) return 'Present';
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric'});
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
}
