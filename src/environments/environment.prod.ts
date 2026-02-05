import { isPlatformBrowser } from "@angular/common";
import { inject, PLATFORM_ID } from "@angular/core";

export const environment = {
    production: true,
    get apiUrl() {
        const platformId = inject(PLATFORM_ID);
        if (isPlatformBrowser(platformId)) {
            return (window as any).__env?.apiUrl || '';
        }
        return '';
    }
};
