# backend/Dockerfile

# Используем официальный образ Node.js версии 20 (более стабильная)
FROM node:20-alpine

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости с очисткой кеша
RUN npm install && npm cache clean --force

# Копируем все остальные файлы проекта
COPY . .

# Открываем порт, на котором работает наше приложение
EXPOSE 3001

# Команда для запуска приложения
CMD [ "npm", "start" ]

# Добавляем метаданные для лучшего отслеживания
LABEL maintainer="farolero-team"
LABEL version="1.0.0"
LABEL description="Farolero Loyalty App Backend"