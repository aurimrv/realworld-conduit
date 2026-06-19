## 1. Frontend — Dependências e Build

- [x] 1.1 Adicionar `nyc` como devDependency no `realworld-app-angular-v20/package.json` (exercício: aluno)
- [x] 1.2 Adicionar etapa `nyc instrument` ao Dockerfile do frontend após o build Angular (exercício: aluno)
- [x] 1.3 Validar que `window.__coverage__` existe no browser após build instrumentado: `docker-compose up --build -d`, abrir `localhost:4200`, inspecionar console

## 2. Frontend — Script de Envio de Cobertura

- [x] 2.1 Adicionar `<script>` inline no `src/index.html` com `setInterval` (5s) + listener `beforeunload` para POST em `/api/coverage/save` (exercício: aluno)
- [x] 2.2 Validar envio periódico: abrir Network tab no DevTools, interagir, confirmar POSTs a cada 5s com payload JSON de cobertura

## 3. Frontend — Coletor Node.js

- [x] 3.1 Criar `coverage-collector.js` no diretório `realworld-app-angular-v20/` que escuta em `127.0.0.1:3000`, aceita POST `/save`, grava `/app/coverage/coverage.json` (instrutor: fornecer esqueleto; aluno: completar)
- [x] 3.2 Criar `entrypoint.sh` que inicia o coletor em background e depois executa nginx (instrutor: fornecer template)
- [x] 3.3 Validar coletor isoladamente: subir container, `curl -X POST http://localhost:3000/save -d '{"test":true}'`, verificar resposta 200

## 4. Frontend — Proxy no nginx

- [x] 4.1 Adicionar bloco `location /api/coverage/` com `proxy_pass http://127.0.0.1:3000;` no `realworld-app-angular-v20/nginx.conf` (exercício: aluno)
- [x] 4.2 Adicionar `nodejs` ao estágio runtime do Dockerfile (`RUN apk add --no-cache nodejs`) e copiar `coverage-collector.js` + `entrypoint.sh` (instrutor: revisar)
- [x] 4.3 Validar proxy: acessar `localhost:4200`, interagir, verificar no Network tab que `POST /api/coverage/save` retorna 200

## 5. Integração — Volume Docker

- [x] 5.1 Adicionar volume mapping no `docker-compose.yml` para o serviço frontend: `./realworld-app-angular-v20/coverage:/app/coverage` (exercício: aluno)
- [x] 5.2 Garantir que diretório `./realworld-app-angular-v20/coverage/` existe ou é criado automaticamente

## 6. Validação — Cobertura Full-Stack

- [x] 6.1 Fluxo completo: `docker-compose up --build -d` → navegar (login, feed, artigo, comentário) → `docker-compose stop` → verificar `coverage.json` existe
- [x] 6.2 Gerar relatório frontend: `cd realworld-app-angular-v20 && mkdir -p .nyc_output && cp coverage/coverage.json .nyc_output/out.json && npx nyc report --reporter=html --reporter=text --report-dir coverage/frontend`
- [x] 6.3 Gerar relatório backend: `cd realworld-springboot-java && ./gradlew jacocoTestReport`
- [x] 6.4 Conferir que ambos os relatórios HTML abrem e mostram percentuais de cobertura por arquivo
- [x] 6.5 Validar source maps: abrir DevTools → Sources, confirmar que arquivos TypeScript originais são exibidos (não JS instrumentado)

## 7. Documentação

- [x] 7.1 Atualizar `HOWTO_MEASURE_COVERAGE.md` com seção de cobertura frontend: instrumentação, coleta automática, geração de relatório (exercício: aluno)
- [x] 7.2 Adicionar nota no `README.md` raiz mencionando que ambos frontend e backend agora geram cobertura automaticamente

## 8. Classroom Verification

- [ ] 8.1 Executar demo de 10 minutos conforme `In-Class Demo Plan` do proposal (instrutor: validar fluxo)
- [ ] 8.2 Verificar que aluno consegue reproduzir sozinho: subir containers → explorar → parar → gerar relatórios → abrir HTMLs
- [ ] 8.3 Coletar feedback: os relatórios lado a lado revelam gaps de cobertura que geram discussão em sala?
