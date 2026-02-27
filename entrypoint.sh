#!/bin/sh

# substitue API_URL in env.js
# envsubst '${API_URL}' < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js

# TODO: substitue API_URL in nginx.conf

exec "$@"