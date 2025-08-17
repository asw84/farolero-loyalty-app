// backend/controllers/instagram.controller.js

const instagramService = require('../services/instagram.service');

/**
 * Инициирует процесс авторизации Instagram
 * GET /auth/instagram/login?tg_user_id=123
 */
async function initiateLogin(req, res) {
    const { tg_user_id } = req.query;
    
    if (!tg_user_id) {
        return res.status(400).json({ error: 'missing_tg_user_id' });
    }

    try {
        const { INSTAGRAM_APP_ID, INSTAGRAM_REDIRECT_URI } = process.env;
        
        if (!INSTAGRAM_APP_ID || INSTAGRAM_APP_ID === 'YOUR_INSTAGRAM_APP_ID') {
            return res.status(500).json({ 
                error: 'instagram_not_configured',
                message: 'Instagram приложение не настроено'
            });
        }

        // Создаем URL авторизации Instagram (исправлено на актуальный Facebook Graph API)
        const authUrl = new URL('https://www.facebook.com/v23.0/dialog/oauth');
        authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
        authUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI);
        authUrl.searchParams.set('scope', 'instagram_basic,instagram_content_publish,instagram_manage_insights');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('state', JSON.stringify({ 
            telegram_user_id: tg_user_id,
            nonce: require('crypto').randomUUID() // Добавлен nonce для безопасности
        }));

        // Перенаправляем на Instagram авторизацию
        return res.redirect(authUrl.toString());
        
    } catch (error) {
        console.error('[INSTAGRAM] ❌ Ошибка инициации авторизации:', error);
        return res.status(500).json({ 
            error: 'instagram_auth_failed',
            message: 'Ошибка инициации авторизации Instagram'
        });
    }
}

async function handleCallback(req, res) {
    const { code, state } = req.query;
    
    let telegram_user_id;
    
    // Пытаемся извлечь telegram_user_id из state параметра
    if (state) {
        try {
            // Если state это JSON
            const stateData = JSON.parse(decodeURIComponent(state));
            telegram_user_id = stateData.telegram_user_id;
        } catch {
            // Если state это просто строка с ID
            telegram_user_id = state;
        }
    }
    
    // Fallback на query параметр
    if (!telegram_user_id) {
        telegram_user_id = req.query.telegram_user_id;
    }
    
    // Последний fallback - заглушка для тестирования
    if (!telegram_user_id) {
        console.warn('[INSTAGRAM] ⚠️  Using fallback telegram_user_id for testing');
        telegram_user_id = 'test_user_123';
    }

    if (!code) {
        return res.status(400).send('Ошибка: отсутствует код авторизации.');
    }

    try {
        const result = await instagramService.handleOAuthCallback(code, telegram_user_id);
        // В реальном приложении здесь нужно перенаправить пользователя
        // обратно в Telegram Mini App с сообщением об успехе.
        res.send(result.message);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {
    initiateLogin,
    handleCallback,
};
