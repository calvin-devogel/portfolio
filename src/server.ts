import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Set security headers including CSP
 */
app.use((req, res, next) => {
  const isDev = process.env['NODE_ENV'] !== 'production';

  const cspDirectives = isDev
    ? [
        // Development: allow localhost connections for APIs/HMR, but avoid broad https: scheme sources.
        `default-src 'self'`,
        `img-src 'self' data: https://media.devogel.dev`, // allow requests to your cdn
        `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
        `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
        `font-src 'self' data:`,
        `connect-src 'self' http://localhost:* ws://localhost:*`,
      ]
    : [
        // Production: no scheme-wide https:, no unsafe-eval, and no unsafe-inline for scripts.
        `default-src 'self'`,
        `img-src 'self' data: https://media.devogel.dev`, // allow requests to your cdn
        `script-src 'self' https://cdn.jsdelivr.net`,
        `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
        `font-src 'self' data:`,
        `connect-src 'self'`,
      ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; ')
  );
  next();
})

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
