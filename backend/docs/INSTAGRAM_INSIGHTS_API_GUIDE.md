# 📊 Instagram Media Insights API - Полное руководство

## 🎯 Введение

Согласно [официальной документации Meta](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights), Instagram Media Insights API теперь доступен для Instagram API with Instagram Login и предоставляет мощные инструменты аналитики.

## 🚨 Критические изменения (до 21 апреля 2025)

### Устаревающие метрики:
- ❌ `plays` 
- ❌ `clips_replays_count`
- ❌ `ig_reels_aggregated_all_plays_count`
- ❌ `impressions` (для контента после 2 июля 2024)

### Новые рекомендуемые метрики:
- ✅ `views` - **основная метрика для всех типов контента**
- ✅ `total_interactions` - общее взаимодействие
- ✅ `ig_reels_video_view_total_time` - время просмотра Reels

---

## 🔐 Требования

### Разрешения (Permissions):
```javascript
instagram_business_basic
instagram_business_content_publish  
instagram_business_manage_insights  // ОБЯЗАТЕЛЬНО для insights
```

### Host URL:
```
https://graph.instagram.com
```

### API Version:
```
v23.0 (последняя)
```

---

## 📊 Доступные метрики по типам медиа

### FEED (посты):
```javascript
const feedMetrics = [
  'views',              // Новая основная метрика
  'likes',
  'comments', 
  'shares',
  'saved',
  'reach',
  'profile_visits',
  'profile_activity',
  'total_interactions'
];
```

### STORY:
```javascript
const storyMetrics = [
  'views',              // Новая основная метрика
  'reach',
  'replies',
  'navigation',
  'profile_visits',
  'shares'
];
```

### REELS:
```javascript
const reelsMetrics = [
  'views',                              // Новая основная метрика
  'likes',
  'comments',
  'shares', 
  'saved',
  'reach',
  'ig_reels_avg_watch_time',
  'ig_reels_video_view_total_time',     // Новая метрика
  'total_interactions'                  // Новая метрика
];
```

---

## 🛠️ Использование API

### Базовый запрос insights:
```javascript
// GET /api/instagram/insights/{media_id}
const insights = await fetch(`/api/instagram/insights/${mediaId}?media_type=FEED`);
```

### Запрос конкретных метрик:
```javascript
// GET /api/instagram/insights/{media_id}?metrics=views,likes,comments
const specificInsights = await fetch(`/api/instagram/insights/${mediaId}?metrics=views,likes,comments`);
```

### Профильная активность с breakdown:
```javascript
// GET /api/instagram/insights/{media_id}/profile-activity
const profileActivity = await fetch(`/api/instagram/insights/${mediaId}/profile-activity`);

// Ответ включает breakdown по типам действий:
{
  "success": true,
  "data": {...},
  "breakdown": [
    {
      "dimension_keys": ["action_type"],
      "results": [
        {"dimension_values": ["email"], "value": 1},
        {"dimension_values": ["bio_link_clicked"], "value": 5}
      ]
    }
  ]
}
```

### Story навигация:
```javascript
// GET /api/instagram/insights/{story_id}/navigation
const navigation = await fetch(`/api/instagram/insights/${storyId}/navigation`);

// Breakdown по типам навигации:
// tap_forward, tap_back, tap_exit, swipe_forward
```

---

## ⚠️ Ограничения и особенности

### Story Insights:
- ⏰ **Доступны только 24 часа** после публикации
- 👥 **Минимум 5 просмотров** (иначе ошибка #10)
- 🌍 **Региональные ограничения** для replies (Европа, Япония)

### Общие ограничения:
- 📅 **Задержка данных**: до 48 часов
- 💾 **Хранение**: до 2 лет
- 📈 **Только органика**: рекламные взаимодействия не учитываются
- 📱 **Альбомы**: insights недоступны для медиа внутри альбомов

### Rate Limits:
- 200 запросов в час на пользователя (стандартный)
- Burst: до 600 запросов в час (временно)

---

## 🔧 Обработка ошибок

### Типичные ошибки:
```javascript
// Ошибка #10 - недостаточно просмотров для story
{
  "error": {
    "code": 10,
    "message": "(#10) Not enough viewers for the media to show insights"
  }
}

// 400 - невалидные параметры
// 403 - нет разрешений
// 190 - токен истёк
```

### Обработка в коде:
```javascript
try {
  const insights = await getMediaInsights(mediaId, accessToken);
} catch (error) {
  if (error.response?.data?.error?.code === 10) {
    return { error: 'insufficient_viewers' };
  }
  if (error.response?.status === 403) {
    return { error: 'permission_denied' };
  }
  throw error;
}
```

---

## 🧪 Тестирование

### Тестовый endpoint:
```bash
GET /api/instagram/insights/test?media_id=MEDIA_ID&access_token=TOKEN
```

### Получение рекомендуемых метрик:
```bash
GET /api/instagram/insights/metrics/feed
GET /api/instagram/insights/metrics/story  
GET /api/instagram/insights/metrics/reels
```

---

## 📚 Примеры ответов API

### Базовые insights:
```json
{
  "success": true,
  "media_id": "17932174733377207",
  "media_type": "FEED",
  "insights": [
    {
      "name": "views",
      "period": "lifetime", 
      "values": [{"value": 1250}],
      "title": "Views",
      "description": "Total number of times the video has been seen"
    },
    {
      "name": "likes", 
      "period": "lifetime",
      "values": [{"value": 89}]
    }
  ],
  "timestamp": "2025-01-31T15:30:00.000Z"
}
```

### Profile Activity с breakdown:
```json
{
  "name": "profile_activity",
  "values": [{"value": 4}],
  "total_value": {
    "value": 4,
    "breakdowns": [{
      "dimension_keys": ["action_type"],
      "results": [
        {"dimension_values": ["email"], "value": 1},
        {"dimension_values": ["bio_link_clicked"], "value": 1},
        {"dimension_values": ["direction"], "value": 1},
        {"dimension_values": ["text"], "value": 1}
      ]
    }]
  }
}
```

---

## 🚀 Лучшие практики

### Кэширование:
- ✅ **Профиль пользователя**: 24 часа
- ✅ **Метаданные медиа**: 1 час  
- ❌ **Токены доступа**: НЕ кэшировать

### Оптимизация запросов:
```javascript
// Батчинг метрик в одном запросе
const metrics = 'views,likes,comments,shares';
const insights = await getInsights(mediaId, metrics);

// Использование breakdown для детализации
const profileActivity = await getProfileActivity(mediaId); // с breakdown
```

### Мониторинг:
- 📊 Отслеживайте rate limits
- 🚨 Настройте алерты на ошибки
- 📈 Логируйте время ответа API
- 🔄 Автоматический retry для временных ошибок

---

## 🔄 Миграция с устаревших метрик

### Замены:
```javascript
// Старые метрики → Новые метрики
'impressions' → 'views'
'plays' → 'views'  
'clips_replays_count' → 'ig_reels_video_view_total_time'
'ig_reels_aggregated_all_plays_count' → 'views'
```

### План миграции:
1. ✅ Обновить scope permissions (добавить `instagram_business_manage_insights`)
2. ✅ Заменить устаревшие метрики на новые
3. ✅ Протестировать с реальными данными
4. ✅ Обновить UI для отображения новых метрик
5. ⏰ **До 21 апреля 2025**: завершить миграцию

---

## 🔗 Полезные ссылки

- [Instagram Media Insights API Reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- [Instagram Platform Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)
- [Meta Business Help - Metrics Labeling](https://business.facebook.com/business/help/metrics-labeling)

---

*Автор: AI Assistant*  
*Дата: 31.01.2025*  
*Проект: Farolero Loyalty App - Instagram Insights Integration*
