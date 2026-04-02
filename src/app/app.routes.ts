import { Routes } from '@angular/router';
import { Home } from '@components/pages/home/home';
import { Resume } from '@components/pages/resume/resume';
import { Projects } from '@components/pages/projects/projects';
import { AccountSettings } from '@components/pages/admin/dashboard/account-settings/account-settings';
import { authGuard } from './auth-guard';
import { Messages } from '@components/pages/admin/dashboard/messages/messages';
import { Blog as AdminBlog } from '@components/pages/admin/dashboard/blog/blog';
import { Users } from '@components/pages/admin/dashboard/users/users';

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
		path: 'chat',
		loadComponent: () => import('@components/pages/chat/chat').then((m) => m.Chat),
		canActivate: [authGuard],
		data: { roles: ['chat_user', 'admin'] },
	},
	{
		path: 'change_password',
		loadComponent: () =>
			import('@components/pages/change-password/change-password').then(
				(m) => m.ChangePassword,
			),
		canActivate: [authGuard],
		data: { roles: ['user', 'chat_user', 'admin'] },
	},
	{
		path: 'invitation/accept',
		loadComponent: () =>
			import('@components/pages/accept-invitation/accept-invitation').then(
				(m) => m.AcceptInvitation,
			),
	},
	{
		path: 'admin',
		loadComponent: () => import('@components/pages/admin/admin').then((m) => m.Admin),
		canActivate: [authGuard],
		canActivateChild: [authGuard],
		data: { roles: ['admin'] },
		children: [
			{ path: '', redirectTo: 'messages', pathMatch: 'full' },
			{ path: 'messages', component: Messages },
			{ path: 'blog', component: AdminBlog },
			{ path: 'account_settings', component: AccountSettings },
			{ path: 'users', component: Users },
		],
	},
	{ path: '**', redirectTo: '', pathMatch: 'full' },
];
