// backend/controllers/amocrm.controller.js
const amocrmService = require('../services/amocrm.service');
const amocrmClient = require('../amocrm/apiClient');
const TokenManager = require('../utils/token-manager');

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
        const tokenManager = TokenManager.getInstance('amocrm');
        console.log('[AmoCRM] 🧪 Тестирование подключения...');
        
        // Проверяем токены через TokenManager
        const tokens = await tokenManager.getTokens();
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
        
        // Также получаем количество контактов для отображения
        const contactsResponse = await authorizedClient.get('/api/v4/contacts', {
            params: { limit: 1 }
        });
        
        if (accountResponse.status === 200) {
            const contactsCount = contactsResponse.data?._embedded?.contacts?.length || 0;
            const totalContactsCount = contactsResponse.data?._total_elements || 0;
            
            console.log('[AmoCRM] ✅ Подключение успешно, аккаунт доступен');
            res.status(200).json({
                success: true,
                message: 'Подключение к AmoCRM успешно',
                tokenStatus: 'valid',
                accountName: accountResponse.data.name || 'Unknown',
                usersCount: totalContactsCount,
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
        
        // Используем правильный подход с кастомными полями
        try {
            const amocrmClient = require('../amocrm/apiClient');
            const authorizedClient = await amocrmClient.getAuthorizedClient();
            
            // Сначала получаем ID поля для Telegram ID
            const fieldsResponse = await authorizedClient.get('/api/v4/contacts/custom_fields');
            let telegramFieldId = null;
            
            if (fieldsResponse.data && fieldsResponse.data._embedded && fieldsResponse.data._embedded.custom_fields) {
                const telegramField = fieldsResponse.data._embedded.custom_fields.find(field =>
                    field.name.toLowerCase().includes('telegram') ||
                    field.name.toLowerCase().includes('tg') ||
                    field.code === 'TELEGRAM_ID'
                );
                
                if (telegramField) {
                    telegramFieldId = telegramField.id;
                    console.log(`[AmoCRM] ✅ Найдено поле Telegram: ${telegramField.name} (ID: ${telegramField.id})`);
                }
            }
            
            if (!telegramFieldId) {
                throw new Error('Поле для Telegram ID не найдено в настройках AmoCRM');
            }
            
            // Ищем контакты по значению кастомного поля
            const contact = await authorizedClient.get('/api/v4/contacts', {
                params: {
                    query: String(telegramId)
                }
            });
            
            if (contact.data && contact.data._embedded && contact.data._embedded.contacts.length > 0) {
                // Ищем контакт, у которого в имени или в кастомных полях есть нужный Telegram ID
                const foundContact = contact.data._embedded.contacts.find(c =>
                    String(c.name).trim() === String(telegramId) ||
                    c.custom_fields_values?.some(field =>
                        field.field_id === telegramFieldId && String(field.values[0]?.value).trim() === String(telegramId)
                    )
                );
                
                if (foundContact) {
                    const points = amocrmService.extractPointsFromContact(foundContact);
                    console.log(`[AmoCRM] ✅ Найден контакт: ${foundContact.name} (ID: ${foundContact.id}), баллов: ${points}`);
                    
                    res.status(200).json({
                        success: true,
                        contact: {
                            id: foundContact.id,
                            name: foundContact.name,
                            points: points
                        }
                    });
                } else {
                    console.log(`[AmoCRM] ⚠️ Контакт с Telegram ID ${telegramId} не найден среди результатов поиска`);
                    res.status(404).json({
                        success: false,
                        message: 'Контакт не найден'
                    });
                }
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
        
        // Используем правильный подход с кастомными полями
        const amocrmClient = require('../amocrm/apiClient');
        const authorizedClient = await amocrmClient.getAuthorizedClient();
        
        // Сначала получаем ID поля для Telegram ID
        const fieldsResponse = await authorizedClient.get('/api/v4/contacts/custom_fields');
        let telegramFieldId = null;
        
        if (fieldsResponse.data && fieldsResponse.data._embedded && fieldsResponse.data._embedded.custom_fields) {
            const telegramField = fieldsResponse.data._embedded.custom_fields.find(field =>
                field.name.toLowerCase().includes('telegram') ||
                field.name.toLowerCase().includes('tg') ||
                field.code === 'TELEGRAM_ID'
            );
            
            if (telegramField) {
                telegramFieldId = telegramField.id;
                console.log(`[AmoCRM] ✅ Найдено поле Telegram: ${telegramField.name} (ID: ${telegramField.id})`);
            }
        }
        
        if (!telegramFieldId) {
            throw new Error('Поле для Telegram ID не найдено в настройках AmoCRM');
        }
        
        // Ищем контакты по значению кастомного поля
        const contact = await authorizedClient.get('/api/v4/contacts', {
            params: {
                query: String(telegramId)
            }
        });
        
        if (contact.data && contact.data._embedded && contact.data._embedded.contacts.length > 0) {
            // Ищем контакт, у которого в имени или в кастомных полях есть нужный Telegram ID
            const foundContact = contact.data._embedded.contacts.find(c =>
                String(c.name).trim() === String(telegramId) ||
                c.custom_fields_values?.some(field =>
                    field.field_id === telegramFieldId && String(field.values[0]?.value).trim() === String(telegramId)
                )
            );
            
            if (foundContact) {
                const points = amocrmService.extractPointsFromContact(foundContact);
                console.log(`[AmoCRM] ✅ Найден контакт: ${foundContact.name} (ID: ${foundContact.id}), баллов: ${points}`);
                
                res.status(200).json({
                    success: true,
                    contact: {
                        id: foundContact.id,
                        name: foundContact.name,
                        points: points
                    }
                });
            } else {
                console.log(`[AmoCRM] ⚠️ Контакт с Telegram ID ${telegramId} не найден среди результатов поиска`);
                res.status(404).json({
                    success: false,
                    message: 'Контакт не найден'
                });
            }
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

// Получение ID кастомного поля для Telegram ID
const getTelegramFieldId = async (req, res) => {
    try {
        const amocrmClient = require('../amocrm/apiClient');
        const authorizedClient = await amocrmClient.getAuthorizedClient();
        
        // Получаем все кастомные поля контактов
        const response = await authorizedClient.get('/api/v4/contacts/custom_fields');
        
        if (response.data && response.data._embedded && response.data._embedded.custom_fields) {
            // Ищем поле с названием, связанным с Telegram
            const telegramField = response.data._embedded.custom_fields.find(field =>
                field.name.toLowerCase().includes('telegram') ||
                field.name.toLowerCase().includes('tg') ||
                field.code === 'TELEGRAM_ID'
            );
            
            if (telegramField) {
                console.log(`[AmoCRM] ✅ Найдено поле Telegram: ${telegramField.name} (ID: ${telegramField.id})`);
                res.status(200).json({
                    success: true,
                    fieldId: telegramField.id,
                    fieldName: telegramField.name,
                    fieldType: telegramField.type
                });
            } else {
                console.log('[AmoCRM] ⚠️ Поле для Telegram ID не найдено');
                res.status(404).json({
                    success: false,
                    message: 'Поле для Telegram ID не найдено'
                });
            }
        } else {
            throw new Error('Не удалось получить список кастомных полей');
        }
    } catch (error) {
        console.error('[AmoCRM] ❌ Ошибка при получении ID поля Telegram:', error.message);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении ID поля Telegram',
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
    getTelegramFieldId,
    // Здесь будут основные функции для работы с AmoCRM
    // например: createContact, updateContact, searchContact и т.д.
};