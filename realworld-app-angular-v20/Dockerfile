# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration development
# Salvar JS originais ANTES da instrumentação (para relatório limpo)
RUN mkdir -p /tmp/original-js && cp dist/realworld-app/browser/*.js /tmp/original-js/
# Instrumentar o build com Istanbul para expor window.__coverage__ no browser
RUN npx nyc instrument dist/realworld-app/browser/ /tmp/instrumented/ && \
    cp /tmp/instrumented/*.js dist/realworld-app/browser/

# Stage 2: Run
FROM nginx:alpine
# Node.js necessário para o coverage-collector (sidecar que persiste cobertura)
RUN apk add --no-cache nodejs
COPY --from=build /tmp/original-js /usr/share/nginx/html/original-js
COPY --from=build /app/dist/realworld-app/browser /usr/share/nginx/html
# Copiar configuração customizada do nginx para lidar com rotas do Angular
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiar coletor de cobertura e entrypoint
COPY coverage-collector.js /usr/share/nginx/
COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh && mkdir -p /app/coverage
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
