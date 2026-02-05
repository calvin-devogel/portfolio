#!/bin/sh

envsubst '${API_URL}' < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js

exec "$@"