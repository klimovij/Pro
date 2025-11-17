# Быстрый старт - Развертывание на GCP

## Шаг 1: Подготовка

1. **Создайте файл `.env`** в папке `mesendger/telegram-clone/`:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=сгенерируйте-случайный-ключ-минимум-32-символа
EXTERNAL_IP=35.223.68.152
CLIENT_URL=http://35.223.68.152
GEMINI_API_KEYS=
```

**Генерация JWT_SECRET (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## Шаг 2: Подключение к серверу

```bash
# Через gcloud CLI (рекомендуется)
gcloud compute ssh instance-20251117-145558 --zone=us-central1-c

# Или через SSH
ssh username@35.223.68.152
```

## Шаг 3: Установка Docker на сервере

```bash
# Обновление системы
sudo apt-get update

# Установка Docker
sudo apt-get install -y docker.io docker-compose

# Запуск Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# ВАЖНО: Выйдите и переподключитесь к SSH
exit
```

## Шаг 4: Копирование файлов

**На вашем локальном компьютере** (из папки `mesendger/telegram-clone/`):

```bash
# Создайте директорию на сервере
ssh username@35.223.68.152 "mkdir -p ~/mesendger"

# Скопируйте файлы
scp -r . username@35.223.68.152:~/mesendger/

# Или используйте rsync (если установлен)
rsync -avz --exclude 'node_modules' --exclude '.git' \
    ./ username@35.223.68.152:~/mesendger/
```

## Шаг 5: Запуск на сервере

```bash
# Подключитесь к серверу
ssh username@35.223.68.152

# Перейдите в директорию проекта
cd ~/mesendger

# Создайте .env файл (если еще не скопирован)
nano .env
# Вставьте содержимое из шага 1, сохраните (Ctrl+O, Ctrl+X)

# Запустите контейнеры
sudo docker-compose up -d --build

# Проверьте статус
sudo docker-compose ps

# Просмотрите логи
sudo docker-compose logs -f
```

## Шаг 6: Настройка файрвола GCP

В [GCP Console](https://console.cloud.google.com):
1. VPC network → Firewall rules
2. Создайте правило:
   - **Name:** `allow-http`
   - **Direction:** Ingress
   - **Action:** Allow
   - **Source IP ranges:** `0.0.0.0/0`
   - **Protocols:** TCP: `80`

Или через командную строку:
```bash
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0
```

## Готово! 🎉

Откройте в браузере: **http://35.223.68.152**

## Полезные команды

```bash
# Просмотр логов
sudo docker-compose logs -f

# Перезапуск
sudo docker-compose restart

# Остановка
sudo docker-compose stop

# Обновление (после копирования новых файлов)
sudo docker-compose up -d --build
```

## Проблемы?

Смотрите полную инструкцию в файле `DEPLOY.md`

