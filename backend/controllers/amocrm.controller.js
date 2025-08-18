// backend/controllers/amocrm.controller.js
const amocrmService = require('../services/amocrm.service');
const amocrmClient = require('../amocrm/apiClient');

const init = async (req, res) => {
    try {
        // Перенаправляем на страницу авторизации AmoCRM
        const authUrl = amocrmClient.getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error('Ошибка при инициализации авторизации AmoCRM:', error);
        res.status(500).send('Ошибка при инициализации авторизации');
    }
};

const callback = async (req, res) => {
    try {
        const { code, state, error } = req.query;
        
        if (error) {
            return res.status(400).send(`Ошибка авторизации: ${error}`);
        }
        
        if (!code) {
            return res.status(400).send('Код авторизации не получен');
        }
        
        // Получаем токены с помощью кода авторизации
        console.log('Получен код авторизации, обмениваем на токены...');
        await amocrmClient.exchangeCodeForTokens(code);
        
        res.status(200).send(`
            <html>
                <head><title>AmoCRM Авторизация</title></head>
                <body>
                    <h1>✅ Авторизация AmoCRM успешно завершена!</h1>
                    <p>Токены доступа успешно получены и сохранены.</p>
                    <p>Теперь можно закрыть эту страницу и вернуться к работе с приложением.</p>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 3000);
                    </script>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Ошибка в callback AmoCRM:', error);
        res.status(500).send(`
            <html>
                <head><title>Ошибка AmoCRM</title></head>
                <body>
                    <h1>❌ Ошибка при получении токенов</h1>
                    <p>Произошла ошибка при обмене кода авторизации на токены доступа.</p>
                    <p>Пожалуйста, попробуйте снова или обратитесь к администратору.</p>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 5000);
                    </script>
                </body>
            </html>
        `);
    }
};

// Тестирование подключения к AmoCRM
const testConnection = async (req, res) => {
    try {
        const amocrmClient = require('../amocrm/apiClient');
        console.log('[AmoCRM] 🧪 Тестирование подключения...');
        
        // Проверяем токены напрямую
        const tokens = amocrmClient.getTokens();
        console.log('[AmoCRM] 📋 Текущие токены:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            createdAt: tokens.created_at ? new Date(tokens.created_at * 1000).toISOString() : 'N/A',
            expiresIn: tokens.expires_in
        });
        
        if (!tokens.access_token) {
            throw new Error('Токен доступа отсутствует. Необходимо пройти авторизацию.');
        }
        
        // Проверяем срок действия токена
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenExpirationTime = tokens.created_at + tokens.expires_in;
        
        if (currentTime >= tokenExpirationTime) {
            console.log('[AmoCRM] 🔄 Токен истек, пробуем обновить...');
            try {
                await amocrmClient.refreshTokens();
                console.log('[AmoCRM] ✅ Токен успешно обновлен');
            } catch (refreshError) {
                throw new Error('Токен истек и не удалось обновить. Необходимо пройти авторизацию заново.');
            }
        }
        
        // Пробуем простой API запрос - получаем информацию об аккаунте
        const authorizedClient = await amocrmClient.getAuthorizedClient();
        const accountResponse = await authorizedClient.get('/api/v4/account');
        
        if (accountResponse.status === 200) {
            console.log('[AmoCRM] ✅ Подключение успешно, аккаунт доступен');
            res.status(200).json({
                success: true,
                message: 'Подключение к AmoCRM успешно',
                tokenStatus: 'valid',
                accountName: accountResponse.data.name || 'Unknown',
                expiresAt: new Date(tokenExpirationTime * 1000).toISOString()
            });
        } else {
            throw new Error('Не удалось получить информацию об аккаунте');
        }
    } catch (error) {
        console.error('[AmoCRM] ❌ Ошибка подключения:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Ошибка подключения к AmoCRM',
            error: error.message
        });
    }
};

// Получение информации о контакте по Telegram ID
const getContactByTelegramId = async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                message: 'telegramId обязателен'
            });
        }
        
        const amocrmService = require('../services/amocrm.service');
        console.log(`[AmoCRM] Поиск контакта по Telegram ID: ${telegramId}`);
        
        // Проверяем подключение к AmoCRM
        try {
            const amocrmClient = require('../amocrm/apiClient');
            const tokens = amocrmClient.getTokens();
            
            if (!tokens.access_token) {
                throw new Error('Токен доступа отсутствует. Необходимо пройти авторизацию.');
            }
            
            // Проверяем срок действия токена и обновляем при необходимости
            const currentTime = Math.floor(Date.now() / 1000);
            const tokenExpirationTime = tokens.created_at + tokens.expires_in;
            
            if (currentTime >= tokenExpirationTime) {
                console.log('[AmoCRM] 🔄 Токен истек, пробуем обновить...');
                await amocrmClient.refreshTokens();
            }
        } catch (tokenError) {
            console.error('[AmoCRM] ❌ Ошибка проверки токена:', tokenError.message);
            return res.status(500).json({
                success: false,
                message: 'Ошибка аутентификации в AmoCRM',
                error: tokenError.message
            });
        }
        
        const contact = await amocrmService.findContactByTelegramId(telegramId);
        
        if (contact) {
            const points = amocrmService.extractPointsFromContact(contact);
            console.log(`[AmoCRM] ✅ Найден контакт: ${contact.name} (ID: ${contact.id}), баллов: ${points}`);
            
            res.status(200).json({
                success: true,
                contact: {
                    id: contact.id,
                    name: contact.name,
                    points: points
                }
            });
        } else {
            console.log(`[AmoCRM] ⚠️ Контакт с Telegram ID ${telegramId} не найден`);
            res.status(404).json({
                success: false,
                message: 'Контакт не найден'
            });
        }
    } catch (error) {
        console.error('[AmoCRM] ❌ Ошибка при поиске контакта:', error.message);
        res.status(500).json({
            success: false,
            message: 'Ошибка при поиске контакта',
            error: error.message
        });
    }
};

// Поиск контакта по Telegram ID через query параметр
const searchContactByTelegramId = async (req, res) => {
    try {
        const { telegramId } = req.query;
        
        if (!telegramId) {
            return res.status(400).json({
                success: false,
                message: 'telegramId обязателен'
            });
        }
        
        const amocrmService = require('../services/amocrm.service');
        console.log(`[AmoCRM] Поиск контакта по Telegram ID (query): ${telegramId}`);
        
        // Проверяем подключение к AmoCRM
        try {
            const amocrmClient = require('../amocrm/apiClient');
            const tokens = amocrmClient.getTokens();
            
            if (!tokens.access_token) {
                throw new Error('Токен доступа отсутствует. Необходимо пройти авторизацию.');
            }
            
            // Проверяем срок действия токена и обновляем при необходимости
            const currentTime = Math.floor(Date.now() / 1000);
            const tokenExpirationTime = tokens.created_at + tokens.expires_in;
            
            if (currentTime >= tokenExpirationTime) {
                console.log('[AmoCRM] 🔄 Токен истек, пробуем обновить...');
                await amocrmClient.refreshTokens();
            }
        } catch (tokenError) {
            console.error('[AmoCRM] ❌ Ошибка проверки токена:', tokenError.message);
            return res.status(500).json({
                success: false,
                message: 'Ошибка аутентификации в AmoCRM',
                error: tokenError.message
            });
        }
        
        const contact = await amocrmService.findContactByTelegramId(telegramId);
        
        if (contact) {
            const points = amocrmService.extractPointsFromContact(contact);
            console.log(`[AmoCRM] ✅ Найден контакт: ${contact.name} (ID: ${contact.id}), баллов: ${points}`);
            
            res.status(200).json({
                success: true,
                contact: {
                    id: contact.id,
                    name: contact.name,
                    points: points
                }
            });
        } else {
            console.log(`[AmoCRM] ⚠️ Контакт с Telegram ID ${telegramId} не найден`);
            res.status(404).json({
                success: false,
                message: 'Контакт не найден'
            });
        }
    } catch (error) {
        console.error('[AmoCRM] ❌ Ошибка при поиске контакта:', error.message);
        res.status(500).json({
            success: false,
            message: 'Ошибка при поиске контакта',
            error: error.message
        });
    }
};

// Экспортируем функции для основного функционала AmoCRM
module.exports = {
    init,
    callback,
    testConnection,
    getContactByTelegramId,
    searchContactByTelegramId,
    // Здесь будут основные функции для работы с AmoCRM
    // например: createContact, updateContact, searchContact и т.д.
};