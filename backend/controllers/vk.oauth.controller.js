// backend/controllers/vk.oauth.controller.js
const vkOAuthService = require('../services/vk.oauth.service');
const htmlTemplateService = require('../services/html.template.service');

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

module.exports = {
    verifyVKIDAuth,
    getTemplatesConfig,
    updateTemplatesConfig
};