# Roomix — AI Interior Design Editor

Веб-приложение для редактирования интерьеров с помощью искусственного интеллекта. Загрузи фото комнаты и получи варианты переоформления: смена цвета стен, стиля, освещения, добавление декора.

## Возможности

- Загрузка фото интерьера и AI-генерация изменений (Google Gemini)
- Сравнение до/после с интерактивным слайдером
- Сохранение проектов с историей генераций
- Личный кабинет: проекты, избранное, корзина
- Авторизация через email и Google

## Технологии

- **Frontend:** React 19, TypeScript, Vite, SCSS Modules
- **AI:** Google Gemini 2.0 Flash (imagen)
- **Backend / БД:** Supabase (PostgreSQL, Auth, Storage)
- **Прокси:** Cloudflare Workers (для работы без VPN в России)

## Запуск локально

1. Клонируй репозиторий:
   ```bash
   git clone https://github.com/your-username/roomix.git
   cd roomix
   ```

2. Установи зависимости:
   ```bash
   npm install
   ```

3. Создай файл `.env` на основе примера:
   ```bash
   cp .env.example .env
   ```
   Заполни переменные (Supabase URL, ключи и т.д.)

4. Запусти dev-сервер:
   ```bash
   npm run dev
   ```

## Переменные окружения

Создай `.env` файл со следующими переменными:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_GEMINI_KEY=your_gemini_key        # только для локальной разработки
VITE_WORKER_URL=your_cloudflare_worker_url
VITE_WORKER_SECRET=your_worker_secret
```
