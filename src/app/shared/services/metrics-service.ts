import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface WebVitalEntry {
    name: string;
    value: number;
    rating: string;
    pathname: string;
}

@Injectable({
    providedIn: 'root',
})
export class MetricsService {
    private platformId = inject(PLATFORM_ID);
    private http = inject(HttpClient);
    private buffer: WebVitalEntry[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;

    collectWebVitals(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const record = ({ name, value, rating }: Metric) => {
            this.buffer.push({ name, value, rating, pathname: window.location.pathname });
            this.scheduleFlush();
        }

        onCLS(record);
        onFCP(record);
        onINP(record);
        onLCP(record);
        onTTFB(record);

        document.addEventListener(
            'visibilitychange',
            () => {
                if (document.visibilityState === 'hidden') this.flush();
            },
            { once: true },
        );
    }

    private scheduleFlush(): void {
        if (this.flushTimer !== null) clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(() => this.flush(), 100);
    }

    private flush(): void {
        if (this.buffer.length === 0) return;

        const metrics = [...this.buffer];
        this.buffer = [];
        if (this.flushTimer !== null) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        const body = JSON.stringify({ metrics });

        if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
            navigator.sendBeacon('/v1/web_vitals', new Blob([body] , { type: 'application/json' }));
        } else {
            this.http.post('/v1/web_vitals', { metrics}).subscribe({ error: () => {} });
        }
    }
}