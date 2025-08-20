#!/bin/bash

# Скрипт для полной пересборки проекта с GitHub (ветка final)
# Запуск: ./download-final-branch.sh

echo "Начинаю полную пересборку проекта с GitHub..."

# Удаляем старую директорию если существует
if [ -d "farolero-loyalty-app" ]; then
    echo "Удаляю старую версию проекта..."
    rm -rf farolero-loyalty-app
fi

# Клонируем только ветку final без всей истории коммитов для экономии места
echo "Скачиваю проект с GitHub..."
git clone --branch final --depth 1 https://github.com/asw84/farolero-loyalty-app.git

echo "Проект успешно скачан в директорию farolero-loyalty-app"

# Переходим в директорию проекта
cd farolero-loyalty-app

echo "Текущая директория: $(pwd)"
echo "Ветка: $(git branch --show-current)"
echo "Последний коммит: $(git log -1 --pretty=format:'%h - %s (%cr)')"

echo ""
echo "Начинаю полную пересборку Docker-контейнеров..."

# Останавливаем и удаляем существующие контейнеры
echo "Останавливаю существующие контейнеры..."
docker-compose down

# Собираем образы с флагом --no-cache для полной пересборки
echo "Собираю Docker-образы..."
docker-compose build --no-cache

# Запускаем контейнеры
echo "Запускаю контейнеры..."
docker-compose up -d

echo ""
echo "Проект успешно пересобран и запущен!"
echo "Проверить статус контейнеров: docker-compose ps"
echo "Просмотреть логи: docker-compose logs -f"