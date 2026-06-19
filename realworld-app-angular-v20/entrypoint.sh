#!/bin/sh
# Copia os JS originais (limpos, sem instrumentação) para o volume
mkdir -p /app/coverage/original-js
mkdir -p /app/coverage/instrumented
cp /usr/share/nginx/html/original-js/*.js /app/coverage/original-js/ 2>/dev/null || true
cp /usr/share/nginx/html/*.js /app/coverage/instrumented/ 2>/dev/null || true
# Inicia o coverage-collector em background e depois o nginx
node /usr/share/nginx/coverage-collector.js &
exec nginx -g "daemon off;"
