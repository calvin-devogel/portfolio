#!/bin/sh

envsubst '${API_URL}' < /usr/share/nginx/html/assets/env.template.ts > /usr/share/nginx/html/assets/env.ts

EXPORT BACKEND_URL=$API_URL
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /tmp/nginx.conf
sudo mv /tmp/nginx.conf /etc/nginx/nginx.conf

exec "$@"