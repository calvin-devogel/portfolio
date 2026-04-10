import { Routes } from '@angular/router';
import { Home } from '@app/home/components/home/home';
import { Resume } from '@app/resume/components/resume/resume';
import { Projects } from '@app/projects/components/projects/projects';
import { AccountSettings } from '@app/admin/components/account-settings/account-settings';
import { authGuard } from '@app/auth/auth-guard'
import { Messages } from '@app/admin/components/messages/messages';
import { Blog as AdminBlog } from '@app/admin/components/blog/blog';
import { Users } from '@app/admin/components/users/users';

export const routes: Routes = [
	{ path: '', component: Home, pathMatch: 'full' },
	{ path: 'resume', component: Resume },
	{ path: 'projects', component: Projects },
	{ path: 'health_check', redirectTo: '' },
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
