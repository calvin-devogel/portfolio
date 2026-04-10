import {
	ApplicationConfig,
	importProvidersFrom,
	provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
	provideRouter,
	withPreloading,
	PreloadAllModules,
	withInMemoryScrolling,
} from '@angular/router';

import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
	provideHttpClient,
	withFetch,
	withInterceptors,
	withXsrfConfiguration,
} from '@angular/common/http';
import { errorInterceptor } from '@app/shared/interceptors/error.interceptor';
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(
			routes,
			withPreloading(PreloadAllModules),
			withInMemoryScrolling({
				scrollPositionRestoration: 'enabled',
				anchorScrolling: 'enabled',
			}),
		),
		provideClientHydration(withEventReplay()),
		provideHttpClient(
			withFetch(),
			withXsrfConfiguration({
				cookieName: 'XSRF-TOKEN',
				headerName: 'X-XSRF-TOKEN',
			}),
			withInterceptors([errorInterceptor]),
		),
		importProvidersFrom(FeatherModule.pick(allIcons)),
		provideMarkdown(),
	],
};
