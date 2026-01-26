import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageLayout } from '../../page-layout/page-layout';
import { ResumeData } from '../../../interfaces/resume-data';
import { ResumeService } from '../../../services/resume-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

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
      catchError((error) => {
        console.error('Error fetching resume data:', error);
        return of(null);
      })
    )
  );

  getSkillTags(details: string): string[] {
    return details ? details.split(',').map(tag => tag.trim()) : [];
  }

  // formatting logic is called on every render. How to pre-format dates?
  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Present';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric'});
  }
}
