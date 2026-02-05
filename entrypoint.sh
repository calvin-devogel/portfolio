#!/bin/sh

# substitue API_URL in env.js
envsubst '${API_URL}' < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js

# substitue API_URL in nginx.conf
envsubst '${API_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec "$@"