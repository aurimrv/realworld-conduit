## ADDED Requirements

### Requirement: Build do frontend produz código instrumentado com Istanbul
O build de produção do frontend Angular SHALL produzir arquivos JavaScript instrumentados com Istanbul, de modo que o objeto `window.__coverage__` fique disponível no browser após o carregamento da aplicação.

**Teaching Note**: Istanbul insere contadores em cada bloco/função/statement do código. Isso permite rastrear quais linhas foram executadas — conceito análogo ao JaCoCo no backend, mas operando no runtime do browser.

#### Scenario: Aplicação carrega com __coverage__ disponível
- **WHEN** o usuário acessa `http://localhost:4200` após `docker-compose up --build`
- **THEN** `window.__coverage__` existe e contém entradas para cada arquivo JavaScript do bundle

#### Scenario: __coverage__ ausente em build não instrumentado
- **WHEN** o build do frontend é executado sem a etapa `nyc instrument`
- **THEN** `window.__coverage__` é `undefined` no browser

### Requirement: Instrumentação não afeta funcionamento da aplicação
A instrumentação Istanbul SHALL ser aplicada como etapa de pós-processamento do build, sem alterar o código fonte TypeScript, e não deve introduzir erros visíveis de runtime na aplicação Angular.

**Teaching Note**: Separação de concerns — o build produz o app funcional, a instrumentação é uma camada adicional que não modifica a lógica de negócio.

#### Scenario: Aplicação funciona normalmente após instrumentação
- **WHEN** o frontend instrumentado é servido pelo nginx
- **THEN** todas as funcionalidades da aplicação (login, feed, criação de artigo, comentários, perfil) operam sem erros visíveis

#### Scenario: Erro de runtime não relacionado à cobertura
- **WHEN** ocorre um erro de runtime na aplicação (ex: API offline)
- **THEN** o erro é tratado normalmente pelos interceptors Angular, sem interferência da instrumentação

### Requirement: Source maps permanecem funcionais após instrumentação
Os source maps originais do build Angular SHALL permanecer utilizáveis após a instrumentação, permitindo debugging no browser com os arquivos TypeScript originais.

**Teaching Note**: Source maps são essenciais para debugging. Se a instrumentação quebrar o mapeamento, o aluno perde a capacidade de inspecionar o código fonte real.

#### Scenario: Debugger mostra código TypeScript original
- **WHEN** o desenvolvedor abre DevTools → Sources e inspeciona um arquivo da aplicação
- **THEN** o código TypeScript original é exibido (não o JavaScript instrumentado)