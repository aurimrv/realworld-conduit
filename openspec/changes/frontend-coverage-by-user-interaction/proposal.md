## Why

Backend já tem cobertura automática via JaCoCo: interage → para container → jacoco.exec salvo no volume. Frontend não tem equivalente: `window.__coverage__` desaparece quando a aba fecha. Para fins didáticos, é essencial que estudantes vejam cobertura full-stack evoluir com interação real, sem precisar de scripts E2E ou comandos manuais no console.

## What Changes

- Adicionar instrumentação Istanbul (`nyc instrument`) ao build do frontend no Dockerfile
- Criar um mini-servidor Node.js (`coverage-collector`) que recebe POST com `window.__coverage__` e persiste em disco
- Adicionar script no `index.html` que envia cobertura periodicamente e no `beforeunload`
- Adicionar proxy no `nginx.conf` para rotear `/api/coverage/save` para o coletor
- Criar `entrypoint.sh` que sobe nginx e coletor juntos no container
- Mapear volume `./realworld-app-angular-v20/coverage:/app/coverage` no docker-compose.yml
- Documentar novo fluxo no HOWTO_MEASURE_COVERAGE.md

## Capabilities

### New Capabilities
- `frontend-code-instrumentation`: instrumentar o build Angular com Istanbul para expor `window.__coverage__`
- `coverage-auto-collection`: coletar cobertura frontend automaticamente e persistir via volume Docker ao parar o container

### Modified Capabilities
(nenhuma — backend permanece inalterado)

## Impact

- **Frontend**: Dockerfile, nginx.conf, index.html, novos coverage-collector.js e entrypoint.sh
- **Integração**: docker-compose.yml ganha volume mapping no serviço frontend
- **Documentação**: HOWTO_MEASURE_COVERAGE.md ganha seção de cobertura frontend
- **Dependências novas**: `nyc` como devDependency, `nodejs` no estágio runtime do container
- **Backend**: sem alterações (JaCoCo existente mantido)
- **Breaking**: nenhum

## Learning Objectives

1. Explicar o que é instrumentação de código e como Istanbul modifica JavaScript para rastrear execução
2. Comparar estratégias de coleta de cobertura: sidecar (backend JaCoCo) vs in-process (frontend Istanbul + coletor)
3. Demonstrar como volumes Docker permitem persistir dados gerados em runtime após `docker-compose stop`
4. Interpretar relatórios de cobertura HTML lado a lado (backend JaCoCo + frontend Istanbul) para identificar código não exercitado

## Prerequisites

- Conceitos básicos de Docker (containers, volumes, docker-compose)
- Noção de cobertura de código (o que é e por que medir)
- Familiaridade com ferramentas de build JavaScript (npm, node)

## In-Class Demo Plan

**Duração**: 10 minutos

1. (2 min) `docker-compose up --build -d` → containers sobem com frontend instrumentado
2. (3 min) Navegar pela aplicação: login, feed, criar artigo, comentar
3. (1 min) `docker-compose stop` → containers param, cobertura salva automaticamente
4. (2 min) Gerar relatórios: `./gradlew jacocoTestReport` + `npx nyc report`
5. (2 min) Abrir ambos os HTML lado a lado e discutir gaps de cobertura
