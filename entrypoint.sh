#!/bin/sh

envsubst '${API_URL}' < /usr/share/nginx/html/assets/env.template.ts > /usr/share/nginx/html/assets/env.ts

exec "$@"