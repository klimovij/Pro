# Инструкция по развертыванию на Google Cloud Platform

## Предварительные требования

1. **Google Cloud Platform аккаунт** с созданным инстансом
2. **SSH ключ** для доступа к инстансу
3. **Docker и Docker Compose** (будут установлены автоматически)
4. **Внешний IP адрес** вашего инстанса: `35.223.68.152`

## Шаг 1: Подготовка локального окружения

### 1.1 Установите необходимые инструменты (если еще не установлены)

**Для Windows:**
- Установите [Git Bash](https://git-scm.com/downloads) или используйте WSL
- Установите [Docker Desktop](https://www.docker.com/products/docker-desktop) (опционально, для локального тестирования)

**Для Linux/Mac:**
- Установите rsync: `sudo apt-get install rsync` (Linux) или `brew install rsync` (Mac)

### 1.2 Настройте переменные окружения

Создайте файл `.env` в корне проекта `mesendger/telegram-clone/`:

```bash
PORT=5000
NODE_ENV=production
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
EXTERNAL_IP=35.223.68.152
CLIENT_URL=http://35.223.68.152
GEMINI_API_KEYS=ваш-api-ключ-если-используется
```

**Генерация JWT_SECRET:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## Шаг 2: Подключение к GCP инстансу

### 2.1 Подключитесь к инстансу через SSH

```bash
# Если у вас есть SSH ключ
ssh -i ~/.ssh/your-key.pem username@35.223.68.152

# Или через gcloud CLI
gcloud compute ssh instance-20251117-145558 --zone=us-central1-c
```

**Примечание:** Имя пользователя может быть:
- Ваш GCP username
- `user` (по умолчанию для некоторых образов)
- `ubuntu` (для Ubuntu образов)

### 2.2 Обновите систему

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

## Шаг 3: Установка Docker на сервере

### 3.1 Установите Docker

```bash
# Установка Docker
sudo apt-get install -y docker.io docker-compose

# Запуск Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# ВАЖНО: Переподключитесь к SSH для применения изменений группы
exit
# Затем подключитесь снова
```

### 3.2 Проверьте установку

```bash
docker --version
docker-compose --version
```

## Шаг 4: Развертывание приложения

### Вариант A: Автоматическое развертывание (рекомендуется)

1. **Сделайте скрипт исполняемым** (Linux/Mac):
```bash
chmod +x deploy-gcp.sh
```

2. **Запустите скрипт развертывания:**
```bash
export EXTERNAL_IP=35.223.68.152
export JWT_SECRET=ваш-секретный-ключ
./deploy-gcp.sh
```

Скрипт автоматически:
- Создаст `.env` файл
- Скопирует файлы на сервер
- Установит Docker (если нужно)
- Запустит контейнеры

### Вариант B: Ручное развертывание

#### 4.1 Копирование файлов на сервер

**С локального компьютера:**

```bash
# Создайте директорию на сервере
ssh username@35.223.68.152 "mkdir -p ~/mesendger"

# Скопируйте файлы (исключая node_modules и .git)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '*.db-shm' --exclude '*.db-wal' \
    ./ username@35.223.68.152:~/mesendger/

# Скопируйте .env файл
scp .env username@35.223.68.152:~/mesendger/.env
```

**Или используйте SCP:**
```bash
scp -r ./ username@35.223.68.152:~/mesendger/
```

#### 4.2 На сервере: Перейдите в директорию проекта

```bash
cd ~/mesendger
```

#### 4.3 Создайте .env файл на сервере

```bash
nano .env
```

Вставьте содержимое:
```
PORT=5000
NODE_ENV=production
JWT_SECRET=ваш-секретный-ключ
EXTERNAL_IP=35.223.68.152
CLIENT_URL=http://35.223.68.152
GEMINI_API_KEYS=
```

Сохраните: `Ctrl+O`, затем `Ctrl+X`

#### 4.4 Запустите Docker Compose

```bash
# Сборка и запуск контейнеров
sudo docker-compose up -d --build

# Проверка статуса
sudo docker-compose ps

# Просмотр логов
sudo docker-compose logs -f
```

## Шаг 5: Настройка файрвола GCP

### 5.1 Откройте порты в GCP Console

1. Перейдите в [GCP Console](https://console.cloud.google.com)
2. Выберите ваш проект
3. Перейдите в **VPC network** → **Firewall rules**
4. Создайте правило для входящего трафика:
   - **Name:** `allow-http-https`
   - **Direction:** Ingress
   - **Action:** Allow
   - **Targets:** All instances in the network
   - **Source IP ranges:** `0.0.0.0/0`
   - **Protocols and ports:** 
     - TCP: `80` (HTTP)
     - TCP: `5000` (если нужен прямой доступ к API)

### 5.2 Или через gcloud CLI

```bash
gcloud compute firewall-rules create allow-http-https \
    --allow tcp:80,tcp:5000 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP and API traffic"
```

## Шаг 6: Проверка работы

### 6.1 Проверьте статус контейнеров

```bash
ssh username@35.223.68.152
cd ~/mesendger
sudo docker-compose ps
```

Оба контейнера должны быть в статусе `Up`.

### 6.2 Проверьте логи

```bash
# Все логи
sudo docker-compose logs

# Только сервер
sudo docker-compose logs server

# Только клиент
sudo docker-compose logs client

# Следить за логами в реальном времени
sudo docker-compose logs -f
```

### 6.3 Откройте приложение в браузере

Перейдите по адресу: **http://35.223.68.152**

## Полезные команды

### Управление контейнерами

```bash
# Остановить контейнеры
sudo docker-compose stop

# Запустить контейнеры
sudo docker-compose start

# Перезапустить контейнеры
sudo docker-compose restart

# Остановить и удалить контейнеры
sudo docker-compose down

# Пересобрать и перезапустить
sudo docker-compose up -d --build

# Просмотр использования ресурсов
sudo docker stats
```

### Обновление приложения

```bash
# 1. На локальном компьютере: скопируйте обновленные файлы
rsync -avz --exclude 'node_modules' --exclude '.git' \
    ./ username@35.223.68.152:~/mesendger/

# 2. На сервере: пересоберите и перезапустите
cd ~/mesendger
sudo docker-compose up -d --build
```

### Резервное копирование базы данных

```bash
# На сервере
cd ~/mesendger
sudo docker-compose exec server cp /app/messenger.db /app/messenger.db.backup

# Копирование на локальный компьютер
scp username@35.223.68.152:~/mesendger/server/messenger.db ./backup/
```

## Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
sudo docker-compose logs

# Проверьте конфигурацию
sudo docker-compose config
```

### Проблема: Порт уже занят

```bash
# Найдите процесс, использующий порт
sudo lsof -i :80
sudo lsof -i :5000

# Остановите процесс или измените порты в docker-compose.yml
```

### Проблема: Ошибки прав доступа

```bash
# Убедитесь, что вы в группе docker
groups

# Если нет, добавьте себя и переподключитесь
sudo usermod -aG docker $USER
exit
# Подключитесь снова
```

### Проблема: CORS ошибки

Убедитесь, что в `.env` файле правильно указан `EXTERNAL_IP`:
```
EXTERNAL_IP=35.223.68.152
CLIENT_URL=http://35.223.68.152
```

## Безопасность

1. **Измените JWT_SECRET** на сильный случайный ключ
2. **Настройте HTTPS** (рекомендуется использовать Cloud Load Balancer с SSL сертификатом)
3. **Ограничьте доступ к порту 5000** только для внутренней сети
4. **Регулярно обновляйте** систему и Docker образы
5. **Настройте резервное копирование** базы данных

## Дополнительные ресурсы

- [Docker документация](https://docs.docker.com/)
- [Docker Compose документация](https://docs.docker.com/compose/)
- [Google Cloud Platform документация](https://cloud.google.com/docs)

