#!/bin/bash

# Скрипт для развертывания на Google Cloud Platform
# Использование: ./deploy-gcp.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Начало развертывания на GCP${NC}"

# Проверка наличия переменных окружения
if [ -z "$EXTERNAL_IP" ]; then
    echo -e "${YELLOW}⚠️  EXTERNAL_IP не установлен. Используйте: export EXTERNAL_IP=35.223.68.152${NC}"
    read -p "Введите внешний IP вашего инстанса: " EXTERNAL_IP
    export EXTERNAL_IP
fi

if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET не установлен. Генерирую случайный секрет...${NC}"
    export JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${GREEN}✅ Сгенерирован JWT_SECRET${NC}"
fi

# Создание .env файла
echo -e "${GREEN}📝 Создание .env файла...${NC}"
cat > .env << EOF
PORT=5000
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
EXTERNAL_IP=${EXTERNAL_IP}
CLIENT_URL=http://${EXTERNAL_IP}
GEMINI_API_KEYS=${GEMINI_API_KEYS:-}
EOF

echo -e "${GREEN}✅ .env файл создан${NC}"

# Копирование файлов на сервер
echo -e "${GREEN}📤 Копирование файлов на сервер...${NC}"
echo -e "${YELLOW}Введите имя пользователя для SSH (обычно это ваш GCP username или 'user'):${NC}"
read -p "Username: " SSH_USER

# Создание директории на сервере
echo -e "${GREEN}📁 Создание директории на сервере...${NC}"
ssh ${SSH_USER}@${EXTERNAL_IP} "mkdir -p ~/mesendger"

# Копирование файлов
echo -e "${GREEN}📦 Копирование проекта...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '*.db-shm' --exclude '*.db-wal' \
    ./ ${SSH_USER}@${EXTERNAL_IP}:~/mesendger/

# Копирование .env файла
scp .env ${SSH_USER}@${EXTERNAL_IP}:~/mesendger/.env

echo -e "${GREEN}✅ Файлы скопированы${NC}"

# Подключение к серверу и установка Docker
echo -e "${GREEN}🐳 Установка Docker на сервере...${NC}"
ssh ${SSH_USER}@${EXTERNAL_IP} << 'ENDSSH'
    # Обновление системы
    sudo apt-get update
    
    # Установка Docker если не установлен
    if ! command -v docker &> /dev/null; then
        echo "Установка Docker..."
        sudo apt-get install -y docker.io docker-compose
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        echo "⚠️  ВАЖНО: Вам нужно переподключиться к SSH для применения изменений группы docker"
    else
        echo "Docker уже установлен"
    fi
    
    # Переход в директорию проекта
    cd ~/mesendger
    
    # Запуск Docker Compose
    echo "Запуск Docker Compose..."
    sudo docker-compose down || true
    sudo docker-compose up -d --build
    
    echo "✅ Контейнеры запущены"
    
    # Показ статуса
    sudo docker-compose ps
ENDSSH

echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo -e "${GREEN}🌐 Ваше приложение доступно по адресу: http://${EXTERNAL_IP}${NC}"
echo -e "${YELLOW}📝 Для просмотра логов используйте: ssh ${SSH_USER}@${EXTERNAL_IP} 'cd ~/mesendger && sudo docker-compose logs -f'${NC}"

