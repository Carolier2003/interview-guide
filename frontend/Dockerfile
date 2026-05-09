# ==============================================================================
# 第一阶段：构建环境 (Builder Stage)
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# 1. 优先复制依赖定义文件
COPY package.json package-lock.json ./

# 2. 安装依赖（--mount=type=cache 持久化 npm 缓存跨构建复用）
RUN --mount=type=cache,target=/root/.npm \
    npm install

# 3. 复制源代码并构建
COPY . .
RUN npm run build

# ==============================================================================
# 第二阶段：生产环境 (Production Stage)
# ==============================================================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
