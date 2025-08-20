// backend/services/vk.config.service.js

/**
 * Сервис для динамического управления настройками VK
 * Включает получение строки подтверждения через API VK
 */

const axios = require('axios');

class VKConfigService {
    constructor() {
        this.config = {
            clientId: process.env.VK_CLIENT_ID,
            clientSecret: process.env.VK_CLIENT_SECRET,
            redirectUri: process.env.VK_REDIRECT_URI,
            accessToken: process.env.VK_ACCESS_TOKEN,
            groupId: process.env.VK_GROUP_ID,
            confirmationToken: process.env.VK_CONFIRMATION_TOKEN,
            secretKey: process.env.VK_SECRET_KEY
        };
        
        this.lastUpdate = null;
        this.updateInterval = parseInt(process.env.VK_CONFIG_UPDATE_INTERVAL) || 3600000; // 1 час по умолчанию
    }

    /**
     * Получает строку подтверждения для группы VK через API
     * @param {string} groupId - ID группы VK
     * @param {string} accessToken - токен доступа VK
     * @returns {Promise<string>} строка подтверждения
     */
    async getCallbackConfirmationCode(groupId, accessToken) {
        try {
            if (!groupId || !accessToken) {
                throw new Error('Не указан groupId или accessToken для получения строки подтверждения');
            }

            console.log(`[VK_CONFIG_SERVICE] 🔄 Получаем строку подтверждения для группы ${groupId}...`);

            const response = await axios.get('https://api.vk.com/method/groups.getCallbackConfirmationCode', {
                params: {
                    group_id: groupId,
                    access_token: accessToken,
                    v: '5.199'
                }
            });

            if (response.data.error) {
                throw new Error(`VK API error: ${response.data.error.error_msg}`);
            }

            const confirmationCode = response.data.response.code;
            console.log(`[VK_CONFIG_SERVICE] ✅ Строка подтверждения получена: ${confirmationCode.substring(0, 8)}...`);

            // Обновляем локальную конфигурацию
            this.config.confirmationToken = confirmationCode;
            this.lastUpdate = new Date();

            return confirmationCode;
        } catch (error) {
            console.error('[VK_CONFIG_SERVICE] ❌ Ошибка при получении строки подтверждения:', error.message);
            throw error;
        }
    }

    /**
     * Получает информацию о группе VK
     * @param {string} groupId - ID группы VK
     * @param {string} accessToken - токен доступа VK
     * @returns {Promise<object>} информация о группе
     */
    async getGroupInfo(groupId, accessToken) {
        try {
            if (!groupId || !accessToken) {
                throw new Error('Не указан groupId или accessToken для получения информации о группе');
            }

            console.log(`[VK_CONFIG_SERVICE] 🔄 Получаем информацию о группе ${groupId}...`);

            const response = await axios.get('https://api.vk.com/method/groups.getById', {
                params: {
                    group_id: groupId,
                    access_token: accessToken,
                    v: '5.199'
                }
            });

            if (response.data.error) {
                throw new Error(`VK API error: ${response.data.error.error_msg}`);
            }

            const groupInfo = response.data.response[0];
            console.log(`[VK_CONFIG_SERVICE] ✅ Информация о группе получена: ${groupInfo.name}`);

            return groupInfo;
        } catch (error) {
            console.error('[VK_CONFIG_SERVICE] ❌ Ошибка при получении информации о группе:', error.message);
            throw error;
        }
    }

    /**
     * Проверяет и обновляет конфигурацию VK
     * @returns {Promise<object>} обновленная конфигурация
     */
    async refreshConfig() {
        try {
            const now = new Date();
            
            // Проверяем, нужно ли обновлять конфигурацию
            if (this.lastUpdate && (now - this.lastUpdate) < this.updateInterval) {
                console.log('[VK_CONFIG_SERVICE] ℹ️ Конфигурация актуальна, обновление не требуется');
                return this.config;
            }

            console.log('[VK_CONFIG_SERVICE] 🔄 Обновляем конфигурацию VK...');

            // Обновляем строку подтверждения, если есть необходимые данные
            if (this.config.groupId && this.config.accessToken) {
                try {
                    await this.getCallbackConfirmationCode(this.config.groupId, this.config.accessToken);
                } catch (error) {
                    console.warn('[VK_CONFIG_SERVICE] ⚠️ Не удалось обновить строку подтверждения:', error.message);
                }
            }

            // Обновляем время последнего обновления
            this.lastUpdate = now;

            console.log('[VK_CONFIG_SERVICE] ✅ Конфигурация VK обновлена');
            return this.config;
        } catch (error) {
            console.error('[VK_CONFIG_SERVICE] ❌ Ошибка при обновлении конфигурации:', error.message);
            throw error;
        }
    }

    /**
     * Получает текущую конфигурацию
     * @returns {object} текущая конфигурация
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Обновляет конфигурацию вручную
     * @param {object} newConfig - новая конфигурация
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.lastUpdate = new Date();
        console.log('[VK_CONFIG_SERVICE] ✅ Конфигурация обновлена вручную');
    }

    /**
     * Проверяет валидность конфигурации
     * @returns {object} результат проверки
     */
    validateConfig() {
        const errors = [];
        const warnings = [];

        if (!this.config.clientId) errors.push('VK_CLIENT_ID не указан');
        if (!this.config.clientSecret) errors.push('VK_CLIENT_SECRET не указан');
        if (!this.config.redirectUri) errors.push('VK_REDIRECT_URI не указан');
        
        if (!this.config.accessToken) warnings.push('VK_ACCESS_TOKEN не указан - некоторые функции недоступны');
        if (!this.config.groupId) warnings.push('VK_GROUP_ID не указан - автоматическое обновление строки подтверждения недоступно');

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            config: this.getConfig()
        };
    }

    /**
     * Получает статус сервиса
     * @returns {object} статус сервиса
     */
    getStatus() {
        return {
            lastUpdate: this.lastUpdate,
            updateInterval: this.updateInterval,
            nextUpdate: this.lastUpdate ? new Date(this.lastUpdate.getTime() + this.updateInterval) : null,
            config: this.validateConfig()
        };
    }
}

module.exports = new VKConfigService();
