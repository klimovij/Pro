# Dockerfile для сервера
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install --omit=dev

# Копирование остальных файлов сервера
COPY . .

# Создание директорий для uploads
RUN mkdir -p uploads/avatars uploads/knowledge

# Открытие порта
EXPOSE 5000

# Запуск сервера
CMD ["node", "server.js"]

