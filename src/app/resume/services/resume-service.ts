import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { parse } from 'yaml';
import { Observable, map } from 'rxjs';
import { ResumeData } from '@app/resume/interfaces/resume-data';

@Injectable({
	providedIn: 'root',
})
export class ResumeService {
	private http = inject(HttpClient);

	private resumeUrl = 'assets/resume.yaml';

	getResumeData(): Observable<ResumeData> {
		return this.http
			.get(this.resumeUrl, { responseType: 'text' })
			.pipe(map((yamlData: string) => parse(yamlData) as ResumeData));
	}
}
