# Guia de Cobertura de Código — Backend e Frontend

Este projeto coleta cobertura de código em **ambas as camadas** automaticamente:
- **Backend** (Spring Boot): JaCoCo agent grava `jacoco.exec`
- **Frontend** (Angular): Istanbul instrumenta o JS e um coletor Node.js persiste `coverage.json`

Basta interagir com a aplicação, parar os containers e gerar os relatórios.

## Fluxo Completo (Backend + Frontend)

```bash
# 1. Subir containers
docker compose up --build -d

# 2. Resetar cobertura (opcional, para começar do zero)
curl -s http://localhost:4200/api/coverage/reset

# 3. Abrir http://localhost:4200 no navegador e explorar

# 4. Parar containers (ambos os arquivos de cobertura são salvos)
docker compose stop

# 5. Gerar relatórios
cd realworld-springboot-java && ./gradlew jacocoTestReport && cd ..
cd realworld-app-angular-v20 && npm run coverage:report && cd ..

# 6. Abrir relatórios
# Backend:  realworld-springboot-java/build/reports/jacoco/jacocoTestReport/html/index.html
# Frontend: realworld-app-angular-v20/coverage/frontend/index.html
```

---

## Limpeza (nova coleta)

```bash
sudo rm -rf realworld-app-angular-v20/coverage/coverage.json \
               realworld-app-angular-v20/coverage/instrumented \
               realworld-app-angular-v20/coverage/original-js \
               realworld-app-angular-v20/coverage/frontend \
               realworld-app-angular-v20/.nyc_output \
               realworld-app-angular-v20/instrumented \
               realworld-springboot-java/jacoco/jacoco.exec
```

---

## Backend — JaCoCo (detalhes)

O agente JaCoCo escreve o arquivo `jacoco.exec` no sistema de arquivos quando a JVM é encerrada. O `docker compose stop` envia `SIGTERM`, permitindo que os "shutdown hooks" salvem o arquivo.

Verifique se o arquivo foi criado em: `./realworld-springboot-java/jacoco/jacoco.exec`.

---

## 2. Como Gerar o Relatório JaCoCo

Uma vez que você tenha o arquivo `jacoco.exec` na pasta local, você pode usar o Gradle para gerar o relatório HTML.

### Ajuste no `build.gradle` (Certifique-se de que está assim)

O Gradle precisa saber onde procurar o arquivo `.exec` gerado pelo Docker. No seu `build.gradle`, a configuração deve apontar para a pasta onde o volume foi mapeado.

```gradle
jacocoTestReport {
    // Indica ao Gradle para usar o arquivo .exec gerado pelo agente no Docker
    executionData.setFrom(fileTree(project.rootDir).include("jacoco/*.exec"))
    
    reports {
        html.required = true
        xml.required = true
    }
}
```

### Comando para Gerar o Relatório

No seu terminal local (fora do Docker), navegue até a pasta do backend e execute:

```bash
cd realworld-springboot-java
./gradlew jacocoTestReport
```

### Onde encontrar o relatório?

O relatório será gerado em:
`realworld-springboot-java/build/reports/jacoco/jacocoTestReport/html/index.html`

Abra o arquivo `index.html` no seu navegador para visualizar a cobertura.

---

## 3. Cobertura do Frontend (Istanbul)

O frontend Angular também gera cobertura de código automaticamente. Enquanto você interage com a aplicação no navegador, o código JavaScript instrumentado com Istanbul rastreia quais linhas foram executadas. Os dados são enviados automaticamente para um coletor dentro do container e persistidos em disco via volume Docker.

### Como funciona

- O build do frontend é instrumentado com `nyc instrument` (Istanbul) — isso insere contadores no JavaScript sem alterar a lógica da aplicação
- Um script no `index.html` envia `window.__coverage__` a cada 5 segundos (se houver alterações) e no fechamento da aba
- Um mini-servidor Node.js (`coverage-collector.js`) recebe os dados e grava em `/app/coverage/coverage.json`
- O volume Docker mapeia `./realworld-app-angular-v20/coverage:/app/coverage` — igual ao backend

### Passos para coletar e gerar o relatório

1. **Inicie os contêineres** com `docker compose up --build -d`
2. **Interaja com a aplicação** através do frontend (login, feed, criar artigo, comentar, editar perfil, etc.)
3. **Pare os contêineres** para finalizar a coleta:

    ```bash
    docker compose stop
    ```

    O arquivo `coverage.json` estará em `./realworld-app-angular-v20/coverage/coverage.json`.

4. **Gerar o Relatório Istanbul**: Navegue até o diretório do frontend e execute:

    ```bash
    cd realworld-app-angular-v20
    npm run coverage:report
    ```


    O relatório HTML será gerado em `realworld-app-angular-v20/coverage/frontend/index.html`.

### Comparando cobertura backend vs frontend

Após gerar ambos os relatórios, abra os HTMLs lado a lado:

| Relatório | Caminho |
|---|---|
| Backend (JaCoCo) | `realworld-springboot-java/build/reports/jacoco/jacocoTestReport/html/index.html` |
| Frontend (Istanbul) | `realworld-app-angular-v20/coverage/frontend/index.html` |

Isso permite ver quais partes do código foram exercitadas pela sua interação — e quais não foram.

---

## Dicas Adicionais

- **Permissões**: Se o arquivo não estiver sendo criado, verifique se a pasta `jacoco` ou `coverage` no seu host tem permissões de escrita para o usuário que o Docker utiliza (geralmente o comando `chmod 777 realworld-springboot-java/jacoco realworld-app-angular-v20/coverage` resolve em ambientes de desenvolvimento).
- **Limpeza**: Antes de uma nova coleta, é recomendável apagar os arquivos antigos (`jacoco.exec` e `coverage.json`) para não misturar os dados de execuções diferentes.
- **Cobertura cumulativa**: O `coverage.json` do frontend é **acumulativo entre ciclos de `up`/`stop`** — se você subir e parar os containers várias vezes, os contadores se somam. Para resetar a cobertura: `curl -s http://localhost:4200/api/coverage/reset` (containers rodando) ou `echo '{}' > realworld-app-angular-v20/coverage/coverage.json` (containers parados).
- **Logs**: Se os arquivos continuarem vazios, verifique os logs ao parar: `docker compose logs backend` e `docker compose logs frontend`.

## Notas de implementação (importante)

- **Preservação das fontes originais:** o processo de build agora copia os arquivos JavaScript não instrumentados (originais) antes da instrumentação para `realworld-app-angular-v20/coverage/original-js`. Isso garante que o relatório mostre o código legível e que os mapeamentos de cobertura (linhas) correspondam ao código exibido.
- **Instrumentação separada:** a instrumentação (`nyc instrument`) é aplicada a uma cópia separada que é servida em runtime; nunca instrumente ou modifique os arquivos que serão usados como fonte do relatório.
- **Geração do relatório:** o gerador de relatório (`generate-report.js`) usa as fontes em `coverage/original-js` como `sourceFinder`, evitando que o HTML de cobertura contenha contadores `cov_...` ou código transformado.
- **Rebuild obrigatório após alterações:** sempre reconstrua a imagem quando mudar o `Dockerfile` ou o `entrypoint.sh`:

```bash
docker compose up --build -d
```

- **Automação e reprodução:** há um script de reprodução com Playwright em `realworld-app-angular-v20/test-coverage.spec.js` que executa os fluxos principais e grava cobertura para o coletor. Use-o para reproduzir a mesma sequência de interações que você faria manualmente.

Se precisar, posso também adicionar um link direto deste HOWTO para o `README.md` do repositório — quer que eu adicione isso? 
- **Frontend sem interação**: Se você não abrir o frontend no navegador, o `coverage.json` não será gerado (ou estará vazio), e o relatório mostrará 0% de cobertura.
