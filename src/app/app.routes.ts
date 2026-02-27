import { Routes } from '@angular/router';
import { Home } from '@components/pages/home/home';
import { Resume } from '@components/pages/resume/resume';
import { Projects } from '@components/pages/projects/projects';
import { Contact } from '@components/pages/contact/contact';
import { Login } from '@components/pages/login/login';
import { authGuard } from './auth-guard';

export const routes: Routes = [
    { path: '', component: Home, pathMatch: 'full' },
    { path: 'resume', component: Resume },
    { path: 'projects', component: Projects },
    { path: 'health_check', redirectTo: '' },
    { path: 'contact', component: Contact },
    { path: 'login', component: Login },
    { 
        path: 'blog',
        loadComponent: () => import('@components/pages/blog/blog').then(m => m.Blog) 
    },
    {
        path: 'blog/:slug',
        loadComponent: () => import('@components/pages/blog/blog-individual/blog-individual').then(m => m.BlogIndividual)
    },
    {
        path: 'admin', 
        loadComponent: () => import('@components/pages/admin/admin').then(m => m.Admin),
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            { path: '', redirectTo: 'messages', pathMatch: 'full' },
            { path: 'messages', loadComponent: () => import('@components/pages/admin/dashboard/messages/messages').then(m => m.Messages) },
            { path: 'blog', loadComponent: () => import('@components/pages/admin/dashboard/blog/blog').then(m => m.Blog) },
        ],
    },
    { path: '**', redirectTo: '', pathMatch: 'full'}, 
];
