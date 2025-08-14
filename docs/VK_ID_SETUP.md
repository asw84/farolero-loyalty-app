# Настройка VK ID для Farolero Loyalty App

## Обзор изменений

Приложение было обновлено для использования **VK ID** вместо устаревшего **VK OAuth** согласно официальной документации VK ID.

## Что изменилось

### Frontend
- ✅ Установлен `@vkid/sdk` пакет
- ✅ Создан компонент `VKIDAuth.tsx` с правильной интеграцией VK ID SDK
- ✅ Обновлена `ProfilePage.tsx` для использования нового компонента
- ✅ Добавлен VK ID SDK в `index.html`

### Backend
- ✅ Обновлен `vk.oauth.service.js` для работы с VK ID API
- ✅ Обновлен `vk.oauth.controller.js` для обработки VK ID callbacks
- ✅ Исправлены endpoints согласно документации VK ID

## Настройка VK ID приложения

### 1. Создание приложения в VK ID

1. Перейдите в [кабинет VK ID](https://id.vk.com/account/apps)
2. Нажмите "Добавить приложение"
3. Заполните название приложения
4. Выберите платформу **Web**
5. Укажите базовый домен: `localhost` (для разработки)
6. Укажите доверенный redirect URL: `http://localhost:3001/api/oauth/vk/callback`

### 2. Получение параметров приложения

После создания приложения вы получите:
- **ID приложения** (client_id) - замените `54020829` в коде
- **Защищенный ключ** (client_secret) - добавьте в `.env`
- **Сервисный ключ доступа** - для backend API

### 3. Настройка переменных окружения

Создайте файл `.env` в папке `backend`:

```env
# VK ID Configuration
VK_CLIENT_ID=YOUR_VK_ID_APP_ID
VK_CLIENT_SECRET=YOUR_VK_ID_CLIENT_SECRET
VK_REDIRECT_URI=http://localhost:3001/api/oauth/vk/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# App Configuration
APP_BASE_URL=http://localhost:3001
NODE_ENV=development
PORT=3001
```

### 4. Обновление APP_ID в коде

Замените `54020829` на ваш реальный APP_ID в файлах:
- `frontend/src/components/VKIDAuth.tsx` (строка 20)
- `frontend/src/pages/ProfilePage.tsx` (если используется)

## Как работает VK ID

### Frontend Flow
1. Пользователь нажимает кнопку "Привязать VK" в профиле
2. VK ID SDK инициализируется с вашим APP_ID
3. Отображается кнопка One Tap для быстрой авторизации
4. При нажатии открывается окно авторизации VK ID
5. После успешной авторизации вызывается callback `onAuth`

### Backend Flow
1. Frontend отправляет данные пользователя на backend
2. Backend сохраняет VK ID в AmoCRM (если настроено)
3. Возвращается подтверждение успешной привязки

## Тестирование

### Локальное тестирование
1. Запустите frontend: `npm run dev` (порт 3000)
2. Запустите backend: `npm start` (порт 3001)
3. Откройте `http://localhost:3000`
4. Перейдите в профиль и попробуйте привязать VK ID

### Проверка логов
- Frontend логи в консоли браузера
- Backend логи в терминале
- Проверьте, что VK ID SDK загружается без ошибок

## Возможные проблемы

### 1. "VK ID SDK не загружен"
- Проверьте, что `https://id.vk.com/auth.js` доступен
- Проверьте консоль браузера на ошибки

### 2. "Ошибка авторизации"
- Проверьте APP_ID в коде
- Проверьте redirect_uri в настройках VK ID приложения
- Убедитесь, что домен `localhost` добавлен в базовые домены

### 3. "Callback не работает"
- Проверьте backend логи
- Убедитесь, что backend запущен на правильном порту
- Проверьте переменные окружения

## Дополнительные возможности

### One Tap авторизация
VK ID SDK поддерживает One Tap авторизацию - пользователь может авторизоваться одним нажатием без ввода логина/пароля.

### Шторка авторизации
Можно добавить шторку авторизации для более удобного UX:

```typescript
VKID.Widgets.Auth({
  container: containerRef.current,
  onAuth: (user) => console.log('Авторизация:', user)
});
```

### Виджет 3 в 1
Для поддержки авторизации через Одноклассники и Mail:

```typescript
VKID.Widgets.ThreeInOne({
  container: containerRef.current,
  onAuth: (user) => console.log('Авторизация:', user)
});
```

## Полезные ссылки

- [Официальная документация VK ID](https://id.vk.com/docs)
- [VK ID SDK GitHub](https://github.com/VKCOM/vkid-sdk)
- [Примеры интеграции](https://id.vk.com/docs/examples)

## Поддержка

При возникновении проблем:
1. Проверьте логи frontend и backend
2. Убедитесь, что все переменные окружения настроены
3. Проверьте настройки VK ID приложения
4. Обратитесь к официальной документации VK ID
