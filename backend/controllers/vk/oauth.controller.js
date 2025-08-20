// backend/controllers/vk.oauth.controller.js
const vkOAuthService = require('../services/vk.oauth.service');
const htmlTemplateService = require('../services/html.template.service');

/**
 * Получает конфигурацию VK для frontend
 * GET /api/vk/config
 */
const getVKClientConfig = async (req, res) => {
    console.log('[VK_ID_CONTROLLER] 🔧 getVKConfig called!');
    try {
        const config = {
            appId: process.env.VK_CLIENT_ID,
            redirectUri: process.env.VK_REDIRECT_URI,
            apiUrl: process.env.APP_BASE_URL || 'https://api.5425685-au70735.twc1.net'
        };
        
        console.log('[VK_ID_CONTROLLER] 🔧 Config:', config);
        
        if (!config.appId) {
            console.log('[VK_ID_CONTROLLER] ❌ VK_CLIENT_ID not configured');
            return res.status(500).json({
                success: false,
                error: 'VK_CLIENT_ID не настроен'
            });
        }
        
        console.log('[VK_ID_CONTROLLER] ✅ Sending config response');
        res.json({
            success: true,
            config: config
        });
    } catch (error) {
        console.error('[VK_ID_CONTROLLER] ❌ Ошибка при получении конфигурации VK:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении конфигурации VK'
        });
    }
};

/**
 * Обрабатывает верификацию данных от VK ID SDK
 * POST /api/oauth/vk/verify-auth
 */
const verifyVKIDAuth = async (req, res) => {
    try {
        const { vkData, telegramId } = req.body;

        if (!vkData || !telegramId) {
            console.error('[VK_ID_CONTROLLER] ❌ Отсутствуют vkData или telegramId в запросе');
            return res.status(400).json({ success: false, error: 'Отсутствуют необходимые данные: vkData и telegramId' });
        }

        console.log(`[VK_ID_CONTROLLER] 🔐 Запрос на верификацию VK ID для Telegram ID: ${telegramId}`);

        const result = await vkOAuthService.verifyAndLinkAccount(vkData, telegramId);

        console.log(`[VK_ID_CONTROLLER] ✅ Аккаунт VK ID успешно привязан для Telegram ID: ${telegramId}`);
        
        res.status(200).json({ success: true, ...result });

    } catch (error) {
        console.error('[VK_ID_CONTROLLER] ❌ Ошибка при верификации данных VK ID:', error);
        res.status(500).json({ success: false, error: error.message || 'Внутренняя ошибка сервера при верификации VK ID' });
    }
};


/**
 * API endpoint для получения текущей конфигурации HTML шаблонов
 * GET /api/vk/oauth/templates/config
 */
const getTemplatesConfig = async (req, res) => {
    try {
        const config = htmlTemplateService.getConfig();
        res.json({
            success: true,
            config: config
        });
    } catch (error) {
        console.error('[VK_ID_CONTROLLER] ❌ Ошибка при получении конфигурации шаблонов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении конфигурации шаблонов'
        });
    }
};

/**
 * API endpoint для обновления конфигурации HTML шаблонов
 * PUT /api/vk/oauth/templates/config
 */
const updateTemplatesConfig = async (req, res) => {
    try {
        const newConfig = req.body;
        
        if (!newConfig || typeof newConfig !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат конфигурации'
            });
        }

        // Обновляем конфигурацию
        htmlTemplateService.updateConfig(newConfig);
        
        res.json({
            success: true,
            message: 'Конфигурация шаблонов обновлена',
            config: htmlTemplateService.getConfig()
        });
    } catch (error) {
        console.error('[VK_ID_CONTROLLER] ❌ Ошибка при обновлении конфигурации шаблонов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении конфигурации шаблонов'
        });
    }
};

/**
 * Обрабатывает OAuth авторизацию через VK
 * GET /auth/vk/login?tg_user_id=123
 */
const handleVKLogin = async (req, res) => {
    try {
        const { tg_user_id } = req.query;
        
        if (!tg_user_id) {
            return res.status(400).send('Отсутствует параметр tg_user_id');
        }
        
        console.log(`[VK_ID_CONTROLLER] 🔐 Запрос на авторизацию VK для Telegram ID: ${tg_user_id}`);
        
        // Формируем URL для авторизации VK OAuth
        const clientId = process.env.VK_CLIENT_ID;
        const redirectUri = encodeURIComponent(process.env.VK_REDIRECT_URI);
        const state = Buffer.from(JSON.stringify({ tg_user_id })).toString('base64');
        
        const authUrl = `https://oauth.vk.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&v=5.199&state=${state}&scope=email`;
        
        console.log(`[VK_ID_CONTROLLER] 🔗 Перенаправление на VK OAuth: ${authUrl}`);
        
        // Перенаправляем пользователя на страницу авторизации VK
        res.redirect(authUrl);
        
    } catch (error) {
        console.error('[VK_ID_CONTROLLER] ❌ Ошибка при обработке запроса на авторизацию VK:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
};

/**
 * Обрабатывает callback от VK OAuth
 * GET /api/oauth/vk/callback?code=...&state=...
 */
const handleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code || !state) {
            return res.status(400).send('Отсутствуют необходимые параметры');
        }
        
        // Декодируем state для получения tg_user_id
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const { tg_user_id } = stateData;
        
        console.log(`[VK_ID_CONTROLLER] 🔐 Получен callback от VK OAuth для Telegram ID: ${tg_user_id}`);
        
        // Здесь должна быть логика обмена кода на токен и получения данных пользователя
        // Для упрощения примера, просто покажем страницу успеха
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Авторизация VK</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .success { color: green; }
                    .error { color: red; }
                </style>
            </head>
            <body>
                <h1 class="success">✅ Авторизация VK завершена!</h1>
                <p>Аккаунт VK успешно привязан к вашему Telegram аккаунту.</p>
                <p>Теперь вы можете закрыть эту вкладку и вернуться в Telegram.</p>
                <script>
                    // Автоматическое закрытие вкладки через 3 секунды
                    setTimeout(() => {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
        `;
        
        res.send(html);
        
    } catch (error) {
        console.error('[VK_ID_CONTROLLER] ❌ Ошибка при обработке callback от VK OAuth:', error);
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ошибка авторизации VK</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .success { color: green; }
                    .error { color: red; }
                </style>
            </head>
            <body>
                <h1 class="error">❌ Ошибка авторизации VK</h1>
                <p>Произошла ошибка при привязке аккаунта VK.</p>
                <p>Попробуйте еще раз или обратитесь в поддержку.</p>
            </body>
            </html>
        `;
        
        res.status(500).send(html);
    }
};

module.exports = {
    verifyVKIDAuth,
    getTemplatesConfig,
    updateTemplatesConfig,
    getVKConfig: getVKClientConfig, // Оставляем старый экспорт для обратной совместимости, если где-то используется
    handleVKLogin,
    handleCallback,
    getVKClientConfig
};