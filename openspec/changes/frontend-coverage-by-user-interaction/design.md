## Context

O backend já possui cobertura automática via JaCoCo agent: ao iniciar o container, o agente é carregado na JVM e grava `jacoco.exec` em disco; o volume Docker mapeia esse arquivo para o host; ao parar o container com `docker-compose stop`, o arquivo persiste e o relatório é gerado com `./gradlew jacocoTestReport`.

O frontend Angular, servido via nginx em container separado, não possui mecanismo equivalente. O código JavaScript gerado pelo build (`@angular/build:application` com esbuild) não é instrumentado, e mesmo que fosse, o `window.__coverage__` do Istanbul vive apenas na memória do browser — desaparece quando a aba fecha.

Esta change introduz cobertura automática no frontend, espelhando a experiência já existente no backend: o aluno explora a aplicação, para os containers, e encontra os dados de cobertura prontos para gerar relatório.

## Goals / Non-Goals

**Goals:**

- Instrumentar o build do frontend com Istanbul para expor `window.__coverage__`
- Coletar automaticamente os dados de cobertura do browser e persistir em disco dentro do container
- Expor os dados via volume Docker para que sobrevivam ao `docker-compose stop`
- Permitir geração de relatório HTML com `npx nyc report` (análogo ao `jacocoTestReport`)
- Manter a experiência do aluno idêntica à do backend: interage → para → gera relatório

**Non-Goals:**

- Não substituir ou alterar o mecanismo de cobertura do backend (JaCoCo)
- Não introduzir scripts E2E automatizados (Playwright, Cypress)
- Não modificar o código fonte TypeScript da aplicação
- Não alterar o builder Angular (`@angular/build:application`)
- Não adicionar cobertura em produção (a instrumentação é apenas para uso didático local)

## Decisions

### 1. Instrumentação pós-build com `nyc instrument` (vs plugin esbuild)

**Escolha**: `nyc instrument` como etapa separada após `npm run build`.

**Alternativa rejeitada**: Plugin esbuild customizado no `angular.json`.
**Razão pedagógica**: O plugin exigiria criar um builder customizado, editar `angular.json` e entender a API de plugins do esbuild — complexidade desproporcional ao objetivo. O `nyc instrument` é um comando de uma linha que funciona com qualquer saída JavaScript, independente do builder. Mais fácil de explicar: "depois de compilar, adicionamos contadores".

### 2. Sidecar Node.js para coleta (vs escrever em localStorage)

**Escolha**: Processo Node.js (`coverage-collector.js`) rodando ao lado do nginx, recebendo POST com `window.__coverage__` e escrevendo em disco.

**Alternativa rejeitada**: Salvar no `localStorage` e depois extrair manualmente.
**Razão**: `localStorage` exigiria ação manual do aluno para exportar. O sidecar Node.js torna a coleta automática, igual ao JaCoCo. O custo é ~30 linhas de JavaScript e +50 MB na imagem (nodejs no Alpine).

### 3. Script de envio no `index.html` (vs Service Worker)

**Escolha**: Script inline no `<script>` do `index.html` com `setInterval` (5s) + listener `beforeunload`.

**Alternativa rejeitada**: Service Worker para postar cobertura em background.
**Razão**: Service Worker adiciona complexidade de ciclo de vida, escopo e debugging. O script inline é trivial de entender e modificar, alinhado ao nível do curso.

### 4. Volume mount para o coverage.json (igual ao backend)

**Escolha**: Volume Docker mapeando `./realworld-app-angular-v20/coverage:/app/coverage`.

**Alternativa rejeitada**: `docker cp` após parar o container.
**Razão**: Quebra a simetria com o backend. O volume torna a experiência uniforme: ambos os arquivos de cobertura "aparecem" no sistema de arquivos local após `docker-compose stop`, sem comandos adicionais.

### Fluxo de dados completo

```
Browser (localhost:4200)
  │
  │ window.__coverage__ (Istanbul)
  │
  ├──[ a cada 5s, se mudou ]──▶ POST /api/coverage/save
  │                              │
  │                              ▼
  │                         nginx (proxy)
  │                              │
  │                              ▼
  │                         coverage-collector.js (:3000)
  │                              │
  │                              ▼
  │                         /app/coverage/coverage.json
  │                              │
  │                              │ volume mount
  │                              ▼
  │                         ./realworld-app-angular-v20/
  │                         coverage/coverage.json
  │
  └──[ beforeunload ]──▶ POST /api/coverage/save (keepalive)
```

## Risks / Trade-offs

- [Risco] `nyc instrument` pode desalinhar source maps → Mitigação: validar com `nyc instrument --source-map` e testar debugging no DevTools antes de aceitar a change como concluída.
- [Risco] Intervalo de 5s pode perder alguns contadores se o aluno for muito rápido → Mitigação: o `beforeunload` captura o estado final. A perda é de no máximo 5s de interação, aceitável para uso didático.
- [Risco] Conflito de porta 3000 com outros serviços locais → Mitigação: o coletor escuta apenas em `127.0.0.1` (não exposto externamente), sem conflito com portas do host.
- [Trade-off] +50 MB na imagem final (nodejs no Alpine) → Aceitável para uso local; a imagem não é distribuída para produção.
- [Trade-off] Script inline no `index.html` vs arquivo separado → Script inline é mais simples de inspecionar (o aluno vê no DevTools), mas menos reutilizável. Adequado ao propósito didático.

## Concepts Reinforced

- **Instrumentação de código**: Istanbul insere contadores sem alterar a lógica (análogo ao JaCoCo bytecode instrumentation)
- **Volumes Docker**: ambos backend e frontend usam o mesmo mecanismo para persistir dados de runtime
- **Comunicação entre processos no container**: nginx + Node.js sidecar como padrão de composição interna
- **Cobertura como métrica de exploração**: o relatório revela quais partes do código foram exercitadas pela interação do usuário

## Migration Plan

1. **Build e deploy**: `docker-compose up --build -d` reconstrói as imagens com as alterações
2. **Validação**: acessar `localhost:4200`, interagir, verificar `window.__coverage__` no console
3. **Verificação de persistência**: `docker-compose stop`, conferir `./realworld-app-angular-v20/coverage/coverage.json`
4. **Geração de relatório**: `npx nyc report --reporter=html` no diretório do frontend
5. **Rollback**: remover as linhas adicionadas no Dockerfile, `entrypoint.sh`, `coverage-collector.js`, e o script no `index.html`; voltar ao `docker-compose.yml` anterior (sem volume no frontend)

## Open Questions

- O `ng test` (Karma) existente deve continuar gerando cobertura unitária separada da cobertura por interação? (Resposta provisória: sim, são métricas complementares — unitária mede testes automatizados, interação mede exploração manual.)
- Devemos adicionar um script npm `coverage:report` para simplificar o comando `npx nyc report`? (Pode ser adicionado como tarefa de melhoria futura.)
