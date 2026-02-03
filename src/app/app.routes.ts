import { Routes } from '@angular/router';
import { Home } from './components/pages/home/home';
import { Resume } from './components/pages/resume/resume';
import { Projects } from './components/pages/projects/projects';
import { Contact } from './components/pages/contact/contact';
import { Login } from './components/pages/login/login';
import { authGuard } from './auth-guard';

export const routes: Routes = [
    { path: '', component: Home, pathMatch: 'full' },
    { path: 'resume', component: Resume },
    { path: 'projects', component: Projects },
    { path: 'health_check', redirectTo: '' },
    { path: 'contact', component: Contact },
    { path: 'login', component: Login, canActivate: [authGuard] },
    {
        path: 'admin', 
        loadComponent: () => import('./components/pages/admin/admin').then(m => m.Admin),
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '', pathMatch: 'full'}, 
];
