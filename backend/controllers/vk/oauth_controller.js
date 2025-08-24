// backend/controllers/vk.oauth.controller.js
const vkOAuthService = require('../../services/vk_oauth_service');
const userService = require('../../services/user.service'); // Импортируем userService
const htmlTemplateService = require('../../services/html.template.service');
const { generateCodeVerifier, generateCodeChallenge } = require('../../utils/pkce-helper');

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
 * NEW: Обрабатывает OAuth авторизацию через VK с использованием PKCE.
 * GET /auth/vk/login?tg_user_id=123
 */
const handleVKLogin = async (req, res) => {
    try {
        const { tg_user_id } = req.query;
        if (!tg_user_id) {
            return res.status(400).send(htmlTemplateService.generateErrorPage('Отсутствует параметр tg_user_id'));
        }

        console.log(`[VK_ID_CONTROLLER] 🔐 Запрос на авторизацию VK для Telegram ID: ${tg_user_id}`);

        // --- PKCE Flow ---
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);

        const statePayload = {
            tg_user_id: tg_user_id,
            code_verifier: codeVerifier // Сохраняем verifier в state
        };
        const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');
        
        const clientId = process.env.VK_CLIENT_ID;
        const redirectUri = process.env.VK_REDIRECT_URI;

        const authUrl = new URL('https://id.vk.com/authorize');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', 'email');
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');

        console.log(`[VK_ID_CONTROLLER] 🔗 Перенаправление на VK ID OAuth: ${authUrl.toString()}`);
        res.redirect(authUrl.toString());

    } catch (error) {
        console.error('[VK_ID_CONTROLLER] ❌ Ошибка при обработке запроса на авторизацию VK:', error);
        res.status(500).send(htmlTemplateService.generateErrorPage('Внутренняя ошибка сервера'));
    }
};


/**
 * NEW: Обрабатывает callback от VK OAuth, обменивает код на токен и получает данные.
 * GET /api/oauth/vk/callback?code=...&state=...
 */
const handleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code || !state) {
            return res.status(400).send(htmlTemplateService.generateErrorPage('Отсутствуют параметры code или state'));
        }

        const statePayload = JSON.parse(Buffer.from(state, 'base64').toString());
        const { tg_user_id, code_verifier } = statePayload;

        if (!tg_user_id || !code_verifier) {
            return res.status(400).send(htmlTemplateService.generateErrorPage('Некорректный параметр state'));
        }

        console.log(`[VK_ID_CONTROLLER] 🔐 Получен callback от VK OAuth для Telegram ID: ${tg_user_id}`);

        // 1. Обмен кода на токен
        const tokenData = await vkOAuthService.exchangeCodeForToken(code, code_verifier);
        const { access_token, user_id: vk_user_id } = tokenData;

        // 2. Получение данных пользователя VK
        const vkUserData = await vkOAuthService.getVKUserData(access_token, vk_user_id);

        // 3. Сохранение/обновление пользователя в нашей БД и AmoCRM
        await userService.linkVkToUser(tg_user_id, vk_user_id, vkUserData);
        
        console.log(`[VK_ID_CONTROLLER] ✅ Пользователь VK ${vkUserData.first_name} ${vkUserData.last_name} (ID: ${vkUserData.id}) успешно авторизован и привязан к Telegram ID ${tg_user_id}.`);

        // Успешная авторизация
        return htmlTemplateService.sendSuccess(res);
  } catch (error) {
    console.error('--- [OAUTH CONTROLLER CATCH BLOCK] ---');
    console.error(`КОНТРОЛЛЕР ПОЙМАЛ ОШИБКУ: ${new Date().toISOString()}`);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('--- END CONTROLLER CATCH BLOCK ---');
    return htmlTemplateService.sendError(res, 'oauth_vk_failed', 'Не удалось завершить авторизацию VK.');
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