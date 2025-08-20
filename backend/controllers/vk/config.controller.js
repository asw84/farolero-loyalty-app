// backend/controllers/vk.config.controller.js

const vkConfigService = require('../services/vk.config.service');

/**
 * Получает текущую конфигурацию VK
 * GET /api/vk/config
 */
const getVKConfig = async (req, res) => {
    try {
        const config = vkConfigService.getConfig();
        const validation = vkConfigService.validateConfig();
        
        res.json({
            success: true,
            config: config,
            validation: validation
        });
    } catch (error) {
        console.error('[VK_CONFIG_CONTROLLER] ❌ Ошибка при получении конфигурации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении конфигурации VK'
        });
    }
};

/**
 * Обновляет конфигурацию VK
 * PUT /api/vk/config
 */
const updateVKConfig = async (req, res) => {
    try {
        const newConfig = req.body;
        
        if (!newConfig || typeof newConfig !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат конфигурации'
            });
        }

        // Обновляем конфигурацию
        vkConfigService.updateConfig(newConfig);
        
        // Получаем обновленную конфигурацию
        const updatedConfig = vkConfigService.getConfig();
        const validation = vkConfigService.validateConfig();
        
        res.json({
            success: true,
            message: 'Конфигурация VK обновлена',
            config: updatedConfig,
            validation: validation
        });
    } catch (error) {
        console.error('[VK_CONFIG_CONTROLLER] ❌ Ошибка при обновлении конфигурации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении конфигурации VK'
        });
    }
};

/**
 * Обновляет конфигурацию VK через API VK
 * POST /api/vk/config/refresh
 */
const refreshVKConfig = async (req, res) => {
    try {
        console.log('[VK_CONFIG_CONTROLLER] 🔄 Запрос на обновление конфигурации VK...');
        
        // Обновляем конфигурацию через API VK
        const updatedConfig = await vkConfigService.refreshConfig();
        const validation = vkConfigService.validateConfig();
        
        res.json({
            success: true,
            message: 'Конфигурация VK обновлена через API VK',
            config: updatedConfig,
            validation: validation
        });
    } catch (error) {
        console.error('[VK_CONFIG_CONTROLLER] ❌ Ошибка при обновлении конфигурации через API VK:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении конфигурации VK через API',
            details: error.message
        });
    }
};

/**
 * Получает строку подтверждения для группы VK
 * POST /api/vk/config/confirmation-code
 */
const getConfirmationCode = async (req, res) => {
    try {
        const { groupId, accessToken } = req.body;
        
        if (!groupId || !accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Необходимо указать groupId и accessToken'
            });
        }

        console.log(`[VK_CONFIG_CONTROLLER] 🔄 Получение строки подтверждения для группы ${groupId}...`);
        
        const confirmationCode = await vkConfigService.getCallbackConfirmationCode(groupId, accessToken);
        
        res.json({
            success: true,
            message: 'Строка подтверждения получена',
            confirmationCode: confirmationCode,
            groupId: groupId
        });
    } catch (error) {
        console.error('[VK_CONFIG_CONTROLLER] ❌ Ошибка при получении строки подтверждения:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении строки подтверждения',
            details: error.message
        });
    }
};

/**
 * Получает информацию о группе VK
 * POST /api/vk/config/group-info
 */
const getGroupInfo = async (req, res) => {
    try {
        const { groupId, accessToken } = req.body;
        
        if (!groupId || !accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Необходимо указать groupId и accessToken'
            });
        }

        console.log(`[VK_CONFIG_CONTROLLER] 🔄 Получение информации о группе ${groupId}...`);
        
        const groupInfo = await vkConfigService.getGroupInfo(groupId, accessToken);
        
        res.json({
            success: true,
            message: 'Информация о группе получена',
            groupInfo: groupInfo
        });
    } catch (error) {
        console.error('[VK_CONFIG_CONTROLLER] ❌ Ошибка при получении информации о группе:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении информации о группе',
            details: error.message
        });
    }
};

/**
 * Получает статус сервиса конфигурации VK
 * GET /api/vk/config/status
 */
const getVKConfigStatus = async (req, res) => {
    try {
        const status = vkConfigService.getStatus();
        
        res.json({
            success: true,
            status: status
        });
    } catch (error) {
        console.error('[VK_CONFIG_CONTROLLER] ❌ Ошибка при получении статуса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении статуса сервиса конфигурации VK'
        });
    }
};

module.exports = {
    getVKConfig,
    updateVKConfig,
    refreshVKConfig,
    getConfirmationCode,
    getGroupInfo,
    getVKConfigStatus
};
