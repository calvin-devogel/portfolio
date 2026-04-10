import { Routes } from '@angular/router';
import { Home } from '@app/home/components/home/home';
import { authGuard } from '@app/auth/auth-guard';

export const routes: Routes = [
	{ path: '', component: Home, pathMatch: 'full' },
	{ path: 'health_check', redirectTo: '' },
	{
		path: 'resume',
		loadComponent: () => import('@app/resume/components/resume/resume').then((m) => m.Resume),
	},
	{
		path: 'projects',
		loadComponent: () =>
			import('@app/projects/components/projects/projects').then((m) => m.Projects),
	},
	{
		path: 'blog',
		loadComponent: () => import('@app/blog/components/blog/blog').then((m) => m.Blog),
	},
	{
		path: 'blog/:slug',
		loadComponent: () =>
			import('@app/blog/components/blog-individual/blog-individual').then(
				(m) => m.BlogIndividual,
			),
	},
	{
		path: 'chat',
		loadComponent: () => import('@app/chat/components/chat/chat').then((m) => m.Chat),
		canActivate: [authGuard],
		data: { roles: ['chat_user', 'admin'] },
	},
	{
		path: 'change_password',
		loadComponent: () =>
			import('@app/auth/components/change-password/change-password').then(
				(m) => m.ChangePassword,
			),
		canActivate: [authGuard],
		data: { roles: ['user', 'chat_user', 'admin'] },
	},
	{
		path: 'invitation/accept',
		loadComponent: () =>
			import('@app/auth/components/accept-invitation/accept-invitation').then(
				(m) => m.AcceptInvitation,
			),
	},
	{
		path: 'admin',
		loadComponent: () => import('@app/admin/components/admin/admin').then((m) => m.Admin),
		canActivate: [authGuard],
		canActivateChild: [authGuard],
		data: { roles: ['admin'] },
		loadChildren: () => import('@app/admin/admin.routes').then((m) => m.adminRoutes),
	},
	{ path: '**', redirectTo: '', pathMatch: 'full' },
];
