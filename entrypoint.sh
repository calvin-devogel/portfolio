#!/bin/sh

envsubst '${API_URL}' < /usr/share/nginx/html/assets/config.template.json > /usr/share/nginx/html/assets/config.json

exec "$@"