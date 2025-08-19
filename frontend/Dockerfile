# frontend/Dockerfile
# Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
# Устанавливаем зависимости с очисткой кеша
RUN npm ci && npm cache clean --force

COPY . .
# Добавляем флаг для принудительной пересборки при каждом деплое
ARG BUILD_VERSION=unknown
RUN echo "Build version: $BUILD_VERSION" > build-info.txt && \
    npm run build

# Production stage
FROM nginx:stable-alpine

# Копируем конфигурацию nginx с настройками против кеширования
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Добавляем конфигурацию для предотвращения кеширования
RUN echo 'add_header Cache-Control "no-cache, no-store, must-revalidate";' > /etc/nginx/conf.d/cache-control.conf && \
    echo 'add_header Pragma "no-cache";' >> /etc/nginx/conf.d/cache-control.conf && \
    echo 'add_header Expires "0";' >> /etc/nginx/conf.d/cache-control.conf

# Копируем файлы сборки
COPY --from=builder /app/dist/ /usr/share/nginx/html

# Копируем информацию о сборке
COPY --from=builder /app/build-info.txt /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]