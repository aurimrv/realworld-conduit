# Guia de Coleta e Geração de Relatório JaCoCo com Docker

Para garantir que o arquivo `jacoco.exec` seja salvo corretamente e que você consiga gerar o relatório de cobertura, siga as instruções abaixo.

## 1. Como Parar o Contêiner Corretamente

O agente JaCoCo escreve o arquivo `jacoco.exec` no sistema de arquivos quando a JVM é encerrada de forma graciosa. O `Ctrl+C` no terminal onde o `docker-compose up` está rodando pode enviar um sinal de interrupção abrupto.

**A maneira recomendada é usar o comando `stop` em um novo terminal:**

1. Mantenha o `docker-compose up` rodando.
2. Abra um **novo terminal** na mesma pasta do projeto.
3. Execute o comando:

    ```bash
    docker compose stop
    ```

    *Este comando envia um sinal `SIGTERM` para a JVM, permitindo que ela execute os "shutdown hooks" e o agente JaCoCo salve o arquivo.*

4. Verifique se o arquivo foi criado em: `./realworld-springboot-java/jacoco/jacoco.exec`.

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
- **Frontend sem interação**: Se você não abrir o frontend no navegador, o `coverage.json` não será gerado (ou estará vazio), e o relatório mostrará 0% de cobertura.
