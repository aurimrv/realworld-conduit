#!/bin/sh
# Copia os JS instrumentados para o volume de cobertura (para nyc report)
mkdir -p /app/coverage/instrumented
cp /usr/share/nginx/html/*.js /app/coverage/instrumented/ 2>/dev/null || true
# Inicia o coverage-collector em background e depois o nginx
node /usr/share/nginx/coverage-collector.js &
exec nginx -g "daemon off;"
