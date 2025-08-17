# 📊 Instagram API - Insights от Context7

## 🎯 Ключевые находки из официальной документации Meta

### 🔍 OAuth Architecture (из Graph API docs)

**Современный подход Meta к авторизации:**
```javascript
// Рекомендуемая конфигурация на 2025 год
const loginConfiguration = {
  permissions: ['instagram_business_basic', 'instagram_business_content_publish'],
  tracking: 'enabled', // Обязательно для корректной работы
  nonce: crypto.randomUUID(), // Для безопасности
  authType: 'rerequest' // Стандартный тип авторизации
};
```

### 📱 Унифицированная система разрешений

**Найденные scope values:**
- `instagram_business_basic` - базовый доступ к профилю
- `instagram_business_content_publish` - публикация контента
- `instagram_business_manage_messages` - управление сообщениями
- `instagram_business_manage_comments` - управление комментариями

### 🔐 Безопасность и валидация

**Обязательные параметры безопасности:**
```javascript
// Nonce для предотвращения CSRF атак
state: JSON.stringify({
  telegram_user_id: user_id,
  nonce: crypto.randomUUID(),
  timestamp: Date.now()
});
```

## 📊 Instagram Media Insights API (НОВОЕ!)

### Критические обновления от 31.01.2025:
**Источник:** [Instagram Media Insights API Reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)

#### 🚨 Устаревающие метрики (до 21 апреля 2025):
- `plays` ❌
- `clips_replays_count` ❌ 
- `ig_reels_aggregated_all_plays_count` ❌
- `impressions` ❌ (для контента после 2 июля 2024)

#### ✅ Новые рекомендуемые метрики:
- `views` ✅ **Основная метрика для FEED, STORY, REELS**
- `total_interactions` ✅ Общее взаимодействие
- `ig_reels_video_view_total_time` ✅ Время просмотра REELS

#### 🔐 Обновленные разрешения:
```javascript
// Обязательные scope для insights
scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights'
```

#### 📊 Endpoint структура:
```javascript
// Новый insights endpoint
GET https://graph.instagram.com/v23.0/{media-id}/insights
  ?metric=views,likes,comments,shares
  &breakdown=action_type
  &access_token={access-token}
```

#### ⚡ Ограничения API:
- **Story insights**: доступны только 24 часа
- **Данные**: задержка до 48 часов
- **Хранение**: до 2 лет
- **Минимум для story**: >5 просмотров (иначе ошибка #10)

---

## ⚙️ Технические обновления

### 1. Token Management
```javascript
// Новая структура токена (из Graph API docs)
{
  "access_token": "IGQVJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "scope": "instagram_business_basic"
}
```

### 2. Error Handling
**Стандартизированные коды ошибок:**
- `100` - Invalid parameter
- `200` - Permissions error
- `400` - Application request limit reached
- `463` - Invalid access token

### 3. Rate Limiting
**Лимиты API (из документации):**
- Standard: 200 calls per hour per user
- Business: Higher limits available
- Burst: 600 calls per hour (temporary)

---

## 🏗️ Архитектурные рекомендации

### OAuth Flow Optimization
```javascript
// Рекомендуемый flow
1. Generate state with nonce
2. Redirect to Instagram OAuth
3. Validate state on callback
4. Exchange code for token
5. Validate token scope
6. Store securely
```

### Error Recovery
```javascript
// Automated token refresh pattern
if (error.code === 190) { // Token expired
  await refreshAccessToken();
  return retryRequest();
}
```

### Fallback Strategies
```javascript
// Graceful degradation
if (instagram_api_unavailable) {
  return {
    status: 'partial',
    message: 'Instagram link pending',
    retry_after: 3600
  };
}
```

---

## 📈 Performance Insights

### Caching Strategy
**Рекомендации от Meta:**
- Cache user profile data: 24 hours
- Cache media metadata: 1 hour
- Never cache access tokens

### Request Optimization
```javascript
// Batch requests when possible
const fields = 'id,username,account_type,media_count';
const url = `https://graph.instagram.com/me?fields=${fields}`;
```

---

## 🚀 Production Checklist

### Pre-deployment
- [ ] Validate all scope permissions
- [ ] Test token refresh flow
- [ ] Implement proper error handling
- [ ] Set up monitoring for rate limits
- [ ] Configure webhook endpoints

### Security Audit
- [ ] Validate HTTPS endpoints
- [ ] Check nonce generation
- [ ] Verify state parameter validation
- [ ] Test CSRF protection
- [ ] Review token storage

### Performance Monitoring
- [ ] Track API response times
- [ ] Monitor rate limit usage
- [ ] Log authentication failures
- [ ] Alert on token expiration

---

## 📚 Документация и ресурсы

### Официальные источники:
- [Meta Graph API Reference](https://developers.facebook.com/docs/graph-api/)
- [Instagram Platform Documentation](https://developers.facebook.com/docs/instagram-platform/)
- [OAuth Best Practices](https://developers.facebook.com/docs/facebook-login/security/)

### Полезные endpoints:
```
OAuth: https://www.instagram.com/oauth/authorize
Token: https://api.instagram.com/oauth/access_token
Graph: https://graph.instagram.com/me
Debug: https://graph.facebook.com/debug_token
```

---

## 🔄 Migration Notes

### From Basic Display API:
1. **Update OAuth URLs** - новый домен www.instagram.com
2. **Change scope format** - добавить префикс `instagram_business_`
3. **Add nonce parameter** - для безопасности
4. **Update error handling** - новые коды ошибок
5. **Implement token refresh** - автоматическое обновление

### Testing Strategy:
1. Test with Instagram Business account
2. Validate scope permissions
3. Check token expiration handling
4. Test rate limit scenarios
5. Verify webhook delivery

---

*Источник: Context7 анализ официальной документации Meta*  
*Дата: 31.01.2025*  
*Проект: Farolero Loyalty App Instagram Integration*
