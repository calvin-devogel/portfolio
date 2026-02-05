#!/bin/sh

envsubst 'API_URL' < /usr/share/nginx/html/environments/environment.prod.ts > /usr/share/nginx/html/environments/environments.development.ts

exec "$@"