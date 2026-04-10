import { Routes } from '@angular/router';
import { Messages } from '@app/admin/components/messages/messages';
import { Blog } from '@app/admin/components/blog/blog';
import { AccountSettings } from '@app/admin/components/account-settings/account-settings';
import { Users } from '@app/admin/components/users/users';

export const adminRoutes: Routes = [
	{ path: '', redirectTo: 'messages', pathMatch: 'full' },
	{ path: 'messages', component: Messages },
	{ path: 'blog', component: Blog },
	{ path: 'account_settings', component: AccountSettings },
	{ path: 'users', component: Users },
];
