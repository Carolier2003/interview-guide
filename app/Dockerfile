# ==============================================================================
# 第一阶段：构建环境 (Builder Stage)
# ==============================================================================
FROM gradle:8.14-jdk21 AS builder
WORKDIR /workspace

# 1. 优先复制 Gradle 构建配置文件（利用 Docker 缓存层）
COPY settings.gradle ./
COPY gradle gradle
COPY app/build.gradle app/
COPY app/src/main/resources/prompts app/src/main/resources/prompts

# 2. 预下载依赖（--mount=type=cache 持久化 Gradle 缓存到 BuildKit 缓存卷，
#    即使依赖缓存层被重建，已下载的 jar 也不会丢失）
RUN --mount=type=cache,target=/home/gradle/.gradle/caches \
    gradle dependencies --no-daemon

# 3. 复制源代码
COPY app/src app/src

# 4. 执行构建（缓存卷同样生效，避免每次重新解析依赖）
RUN --mount=type=cache,target=/home/gradle/.gradle/caches \
    gradle :app:bootJar --no-daemon -x test

# ==============================================================================
# 第二阶段：运行环境 (Runtime Stage)
# ==============================================================================
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /workspace/app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
