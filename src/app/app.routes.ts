import { Routes } from '@angular/router';
import { Home } from './components/pages/home/home';
import { Resume } from './components/pages/resume/resume';
import { Projects } from './components/pages/projects/projects';

export const routes: Routes = [
    { path: '', component: Home, pathMatch: 'full' },
    { path: 'resume', component: Resume },
    { path: 'projects', component: Projects },
    { path: 'health_check', redirectTo: '' },
    { path: '**', redirectTo: '', pathMatch: 'full'}, 
];
