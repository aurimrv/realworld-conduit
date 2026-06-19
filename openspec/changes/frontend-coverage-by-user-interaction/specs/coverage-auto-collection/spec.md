## ADDED Requirements

### Requirement: Cobertura é enviada automaticamente do browser para o container
O frontend SHALL enviar o conteúdo de `window.__coverage__` para um endpoint local (`/api/coverage/save`) a cada 5 segundos enquanto houver alterações nos dados de cobertura, e também no evento `beforeunload` ao fechar a aba.

**Teaching Note**: O envio periódico garante que a cobertura acumulada não se perca se o aluno fechar o navegador abruptamente. O `beforeunload` cobre o caso de fechamento intencional da aba.

#### Scenario: Envio periódico enquanto aluno navega
- **WHEN** o aluno interage com a aplicação (navega entre páginas, cria artigo, adiciona comentário)
- **THEN** a cada 5 segundos o browser envia POST para `/api/coverage/save` com o JSON atualizado de `window.__coverage__`

#### Scenario: Envio no fechamento da aba
- **WHEN** o aluno fecha a aba ou janela do navegador
- **THEN** o browser envia POST para `/api/coverage/save` com o último estado de `window.__coverage__` usando `keepalive: true`

#### Scenario: Sem envio quando cobertura não mudou
- **WHEN** o aluno mantém a página aberta sem interagir (sem novos cliques ou navegações)
- **THEN** o browser não envia POSTs redundantes (último payload é igual ao anterior)

### Requirement: Coletor persiste cobertura em disco dentro do container
Um processo Node.js (`coverage-collector`) SHALL escutar em `127.0.0.1:3000` e aceitar requisições POST em `/save`, gravando o corpo da requisição como JSON no arquivo `/app/coverage/coverage.json`.

**Teaching Note**: Este é o equivalente funcional do JaCoCo agent no backend — um processo que recebe dados de cobertura e os escreve em disco para persistência.

#### Scenario: POST salva coverage.json
- **WHEN** o coletor recebe POST em `/save` com JSON válido de cobertura
- **THEN** o arquivo `/app/coverage/coverage.json` é criado/atualizado com o conteúdo recebido

#### Scenario: POST com JSON inválido retorna erro
- **WHEN** o coletor recebe POST em `/save` com corpo que não é JSON válido
- **THEN** retorna HTTP 500 e não corrompe o arquivo existente

#### Scenario: Diretório de saída não existe
- **WHEN** o diretório `/app/coverage/` não existe no primeiro POST
- **THEN** o coletor cria o diretório automaticamente antes de gravar o arquivo

### Requirement: Nginx faz proxy das requisições de cobertura para o coletor
O nginx SHALL encaminhar requisições para `/api/coverage/` ao coletor Node.js em `http://127.0.0.1:3000`, sem interferir no roteamento SPA das demais rotas.

**Teaching Note**: O proxy no nginx evita problemas de CORS e mantém a comunicação interna ao container, sem expor o coletor na rede externa.

#### Scenario: Requisição de cobertura roteada corretamente
- **WHEN** o browser envia POST para `/api/coverage/save`
- **THEN** o nginx encaminha para `http://127.0.0.1:3000/save` e retorna a resposta do coletor

#### Scenario: Rotas da aplicação não são afetadas
- **WHEN** o browser navega para qualquer rota da aplicação Angular (ex: `/login`, `/article/123`)
- **THEN** o nginx serve o `index.html` normalmente (comportamento SPA preservado)

### Requirement: Cobertura persiste após docker-compose stop
Após `docker-compose stop`, o arquivo `coverage.json` SHALL estar disponível no host em `./realworld-app-angular-v20/coverage/coverage.json`, pronto para geração de relatório.

**Teaching Note**: Este é o requisito central da experiência do aluno — assim como o `jacoco.exec` do backend, o arquivo de cobertura do frontend deve "aparecer" no sistema de arquivos local após parar os containers.

#### Scenario: Arquivo disponível após stop
- **WHEN** o aluno executa `docker-compose stop` após interagir com a aplicação
- **THEN** o arquivo `./realworld-app-angular-v20/coverage/coverage.json` existe e contém dados de cobertura válidos

#### Scenario: Arquivo vazio se não houve interação
- **WHEN** o aluno sobe os containers mas não abre o frontend no browser
- **THEN** o arquivo `coverage.json` não é criado (ou está vazio), e o relatório gerado mostra 0% de cobertura

### Requirement: Relatório HTML pode ser gerado a partir do coverage.json
O aluno SHALL poder gerar um relatório HTML de cobertura a partir do arquivo `coverage.json` usando o comando `npx nyc report --reporter=html`.

**Teaching Note**: Fechamento do ciclo — o aluno vê o resultado concreto da sua exploração em um relatório visual, análogo ao que o JaCoCo produz para o backend.

#### Scenario: Geração de relatório com dados de cobertura
- **WHEN** o aluno executa `npx nyc report --reporter=html --reporter=text` no diretório `realworld-app-angular-v20/`
- **THEN** um relatório HTML é gerado em `coverage/frontend/index.html` mostrando percentuais por arquivo

#### Scenario: Relatório mostra gaps de cobertura
- **WHEN** o aluno interage apenas com feed e login, sem acessar a tela de settings
- **THEN** o relatório HTML mostra 0% de cobertura para os componentes da feature de settings