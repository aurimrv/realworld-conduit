# Stage 1: Build
FROM gradle:7.6.1-jdk17 AS build
WORKDIR /app
COPY . .
RUN ./gradlew clean build -x test

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Baixar o agente JaCoCo
RUN apk add --no-cache curl && \
    curl -L https://repo1.maven.org/maven2/org/jacoco/org.jacoco.agent/0.8.11/org.jacoco.agent-0.8.11-runtime.jar -o jacocoagent.jar

COPY --from=build /app/build/libs/realworld-spring-boot-java-2.1.1.jar app.jar

# Criar diretório para o jacoco.exec e garantir permissões
RUN mkdir -p /app/jacoco && chmod 777 /app/jacoco

EXPOSE 8080

# Configurar o agente JaCoCo para salvar o arquivo ao parar o contêiner
# destfile define onde o arquivo será salvo dentro do contêiner
# output=file garante que ele escreva no sistema de arquivos
ENTRYPOINT ["java", "-javaagent:jacocoagent.jar=destfile=/app/jacoco/jacoco.exec,output=file,append=true", "-jar", "app.jar"]
