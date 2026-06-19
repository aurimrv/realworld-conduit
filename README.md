# RealWorld App com Docker e Cobertura de Código

Este projeto demonstra como executar o frontend (Angular) e o backend (Spring Boot) da aplicação RealWorld usando Docker e Docker Compose, com coleta automática de cobertura de código em ambas as camadas (backend via JaCoCo, frontend via Istanbul).

## Pré-requisitos

Certifique-se de ter o Docker e o Docker Compose instalados em sua máquina. Você pode baixá-los e instalá-los a partir dos links oficiais:

*   [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Estrutura do Projeto

```
.
├── realworld-springboot-java
│   ├── Dockerfile
│   ├── build.gradle
│   └── ... (código fonte do backend)
├── realworld-app-angular-v20
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ... (código fonte do frontend)
└── docker-compose.yml
└── README.md
```

## Como Executar

Siga os passos abaixo para construir e iniciar os contêineres do frontend e backend.

### 1. Navegar até o Diretório Raiz do Projeto

Abra seu terminal e navegue até o diretório onde o arquivo `docker-compose.yml` está localizado (neste caso, `/home/ubuntu/realworld-conduit/realworld-conduit/`):

```bash
cd /home/ubuntu/realworld-conduit/realworld-conduit/
```

### 2. Construir e Iniciar os Contêineres

Execute o seguinte comando para construir as imagens Docker e iniciar os serviços definidos no `docker-compose.yml`:

```bash
docker compose up --build -d
```

*   `docker compose up`: Inicia os serviços.
*   `--build`: Reconstrói as imagens Docker. Use isso sempre que fizer alterações no código-fonte ou nos Dockerfiles.
*   `-d`: Executa os contêineres em modo "detached" (em segundo plano).

### 3. Acessar a Aplicação

Após os contêineres serem iniciados, você pode acessar a aplicação:

*   **Frontend (Angular)**: Abra seu navegador e acesse [http://localhost:4200](http://localhost:4200)
*   **Backend (Spring Boot)**: O backend estará disponível em [http://localhost:8080](http://localhost:8080) (para chamadas da API pelo frontend).

### 4. Coletar Cobertura de Código com JaCoCo

O backend está configurado para coletar dados de cobertura de código usando o agente JaCoCo. O arquivo `jacoco.exec` será gerado e persistido no seu sistema de arquivos local.

**Passos para coletar e gerar o relatório:**

1.  **Inicie os contêineres** conforme o passo 2 acima (`docker-compose up --build -d`).
2.  **Interaja com a aplicação** através do frontend (por exemplo, faça login, crie um artigo, etc.) para que o backend execute o código e colete os dados de cobertura.
3.  **Pare os contêineres** para que o agente JaCoCo finalize a escrita do arquivo `jacoco.exec`:

    ```bash
    docker compose stop
    ```

    O arquivo `jacoco.exec` será salvo no diretório `./realworld-springboot-java/jacoco/` na raiz do seu projeto local.

4.  **Gerar o Relatório JaCoCo**: Navegue até o diretório do backend e execute a tarefa `jacocoTestReport` do Gradle. Certifique-se de que o `jacoco.exec` esteja presente no diretório `./realworld-springboot-java/jacoco/`.

    ```bash
    cd realworld-springboot-java
    ./gradlew jacocoTestReport
    ```

    O relatório HTML será gerado em `realworld-springboot-java/build/reports/jacoco/jacocoTestReport/html/index.html`.

### 5. Verificar o Status dos Contêineres

Para ver o status dos contêineres em execução:

```bash
docker compose ps
```

### 6. Visualizar Logs

Para visualizar os logs de um serviço específico (por exemplo, `frontend` ou `backend`):

```bash
docker compose logs -f frontend
docker compose logs -f backend
```

### 7. Parar e Remover os Contêineres

Para parar e remover todos os contêineres, redes e volumes criados pelo `docker-compose.yml`:

```bash
docker compose down
```

Se você quiser remover também as imagens:

```bash
docker compose down --rmi all
```

---

**Observação:** Certifique-se de que as portas `4200` e `8080` não estejam sendo usadas por outros aplicativos em sua máquina local antes de iniciar os contêineres.
