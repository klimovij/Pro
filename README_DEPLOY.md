# 🚀 Развертывание Mesendger на Google Cloud Platform

## Быстрая инструкция

### 1. Подготовка на вашем компьютере

1. **Создайте файл `.env`** в папке `mesendger/telegram-clone/`:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=ваш-случайный-ключ-минимум-32-символа
EXTERNAL_IP=35.223.68.152
CLIENT_URL=http://35.223.68.152
GEMINI_API_KEYS=
```

**Сгенерируйте JWT_SECRET (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 2. Подключение к серверу GCP

```bash
# Через gcloud CLI
gcloud compute ssh instance-20251117-145558 --zone=us-central1-c

# Или через SSH
ssh username@35.223.68.152
```

### 3. Установка Docker на сервере

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# ВАЖНО: Выйдите и переподключитесь!
exit
```

### 4. Копирование файлов

**На вашем компьютере** (из папки `mesendger/telegram-clone/`):

```bash
# Создайте папку на сервере
ssh username@35.223.68.152 "mkdir -p ~/mesendger"

# Скопируйте файлы (используйте Git Bash или WSL на Windows)
scp -r . username@35.223.68.152:~/mesendger/
```

### 5. Запуск на сервере

```bash
# Подключитесь к серверу
ssh username@35.223.68.152

# Перейдите в папку проекта
cd ~/mesendger

# Создайте .env файл (если еще не скопирован)
nano .env
# Вставьте содержимое из шага 1, сохраните (Ctrl+O, Enter, Ctrl+X)

# Запустите Docker
sudo docker-compose up -d --build

# Проверьте статус
sudo docker-compose ps

# Смотрите логи
sudo docker-compose logs -f
```

### 6. Настройка файрвола GCP

В [GCP Console](https://console.cloud.google.com):
1. **VPC network** → **Firewall rules**
2. **Create Firewall Rule**:
   - Name: `allow-http`
   - Direction: **Ingress**
   - Action: **Allow**
   - Targets: **All instances**
   - Source IP ranges: `0.0.0.0/0`
   - Protocols: **TCP**, Port: `80`

Или через командную строку:
```bash
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0
```

## ✅ Готово!

Откройте в браузере: **http://35.223.68.152**

## 📋 Полезные команды

```bash
# Просмотр логов
sudo docker-compose logs -f

# Перезапуск
sudo docker-compose restart

# Остановка
sudo docker-compose stop

# Обновление (после копирования новых файлов)
sudo docker-compose up -d --build

# Просмотр статуса
sudo docker-compose ps
```

## 🔧 Решение проблем

**Контейнеры не запускаются:**
```bash
sudo docker-compose logs
```

**Порт занят:**
```bash
sudo lsof -i :80
```

**Проблемы с правами:**
```bash
sudo usermod -aG docker $USER
exit
# Переподключитесь
```

## 📚 Подробная инструкция

Смотрите файл `DEPLOY.md` для детальной информации.

