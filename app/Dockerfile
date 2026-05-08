# ==============================================================================
# 第一阶段：构建环境 (Builder Stage)
# 作用：使用包含 JDK 和 Gradle 的完整镜像来编译源代码
# ==============================================================================
FROM gradle:8.14-jdk21 AS builder
WORKDIR /workspace

# 1. 优先复制 Gradle 构建配置文件（利用 Docker 缓存层）
# 只要这些文件不变，后续 RUN gradle dependencies 就会被缓存，跳过依赖下载
COPY settings.gradle ./
COPY gradle gradle
COPY app/build.gradle app/
COPY app/src/main/resources/prompts app/src/main/resources/prompts

# 2. 预下载依赖（只要 build.gradle 不变，这层就会被缓存）
RUN gradle dependencies --no-daemon

# 3. 复制源代码（依赖已缓存，源码变化不会触发重新下载）
COPY app/src app/src

# 4. 执行构建（跳过测试，加快构建速度）
RUN gradle :app:bootJar --no-daemon -x test

# ==============================================================================
# 第二阶段：运行环境 (Runtime Stage)
# 作用：使用轻量级的 JRE 镜像来运行编译好的 JAR 包
# 多阶段构建显著减小最终镜像体积
# ==============================================================================
FROM eclipse-temurin:21-jre
WORKDIR /app

# 从第一阶段复制生成的 JAR 文件
COPY --from=builder /workspace/app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
