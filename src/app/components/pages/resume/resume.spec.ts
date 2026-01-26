import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Resume } from './resume';
import { ResumeService } from '../../../services/resume-service';
import { of } from 'rxjs';
import { ResumeData } from '../../../interfaces/resume-data';
import { provideRouter } from '@angular/router';

describe('Resume', () => {
  let component: Resume;
  let fixture: ComponentFixture<Resume>;

  // mock resume data
  const mockResumeData: ResumeData = {
    cv: {
      name: 'John Doe',
      sections: {
        summary: ['Professional summary'],
        skills: [
          { label: 'Languages', details: 'TypeScript, Python, Go' },
          { label: 'Empty', details: '' }
        ],
        experience: [
          {
            company: 'Tech Corp',
            location: 'Remote',
            position: 'Developer',
            start_date: '2020-01',
            end_date: '2022-01',
            highlights: ['Built things']
          }
        ],
        education: [
          {
            institution: 'University',
            area: 'CS',
            degree: 'BS',
            end_date: '2019-05',
            highlights: []
          }
        ]
      }
    }
  };

  const mockResumeService = {
    getResumeData: vi.fn().mockReturnValue(of(mockResumeData))
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resume],
      providers: [
        { provide: ResumeService, useValue: mockResumeService },
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Resume);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format experience dates correctly', () => {
    const data = component.resumeData();
    const job = data?.cv.sections.experience[0];

    expect(job?.start_date).toBe('Jan 2020');
    expect(job?.end_date).toBe('Jan 2022');
  });

  it('should format education dates correctly', () => {
    const data = component.resumeData();
    const education = data?.cv.sections.education[0];

    expect(education?.end_date).toBe('May 2019');
  });

  it('should split skill details into tags correctly', () => {
    const data = component.resumeData();
    const skillGroup = data?.cv.sections.skills[0];
    const emptySkillGroup = data?.cv.sections.skills[1];

    expect(skillGroup?.['tags']?.length).toBe(3);
    expect(skillGroup?.['tags']).toEqual(['TypeScript', 'Python', 'Go']);
    expect(emptySkillGroup?.['tags']?.length).toBe(0);
  })
});
