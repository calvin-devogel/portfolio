import { Routes } from '@angular/router';
import { Home } from '@components/pages/home/home';
import { Resume } from '@components/pages/resume/resume';
import { Projects } from '@components/pages/projects/projects';
import { AccountSettings } from '@components/pages/admin/dashboard/account-settings/account-settings';
import { authGuard } from './auth-guard';
import { Messages } from '@components/pages/admin/dashboard/messages/messages';
import { Blog as AdminBlog } from '@components/pages/admin/dashboard/blog/blog';

export const routes: Routes = [
	{ path: '', component: Home, pathMatch: 'full' },
	{ path: 'resume', component: Resume },
	{ path: 'projects', component: Projects },
	{ path: 'health_check', redirectTo: '' },
	{
		path: 'blog',
		loadComponent: () => import('@components/pages/blog/blog').then((m) => m.Blog),
	},
	{
		path: 'blog/:slug',
		loadComponent: () =>
			import('@components/pages/blog/blog-individual/blog-individual').then(
				(m) => m.BlogIndividual,
			),
	},
	{
		path: 'admin',
		loadComponent: () => import('@components/pages/admin/admin').then((m) => m.Admin),
		canActivate: [authGuard],
		canActivateChild: [authGuard],
		children: [
			{ path: '', redirectTo: 'messages', pathMatch: 'full' },
			{ path: 'messages', component: Messages },
			{ path: 'blog', component: AdminBlog },
			{ path: 'account-settings', component: AccountSettings },
		],
	},
	{ path: '**', redirectTo: '', pathMatch: 'full' },
];
