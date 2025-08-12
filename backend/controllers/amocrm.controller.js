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
        
        // Получаем авторизованного клиента
        const client = await amocrmClient.getAuthorizedClient();
        
        // Пробуем получить список пользователей
        const usersResponse = await client.get('/api/v4/users');
        const usersCount = usersResponse.data._embedded?.users?.length || 0;
        
        console.log(`[AmoCRM] ✅ Подключение успешно! Получено ${usersCount} пользователей`);
        
        res.status(200).json({
            success: true,
            message: 'Подключение к AmoCRM успешно',
            usersCount: usersCount
        });
    } catch (error) {
        console.error('[AmoCRM] ❌ Ошибка подключения:', error.message);
        console.error('[AmoCRM] Подробности:', error.response?.data || error);
        
        res.status(500).json({
            success: false,
            message: 'Ошибка подключения к AmoCRM',
            error: error.message,
            details: error.response?.data || null
        });
    }
};

// Получение информации о контакте по Telegram ID
const getContactByTelegramId = async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({ message: 'telegramId обязателен' });
        }
        
        const amocrmService = require('../services/amocrm.service');
        console.log(`[AmoCRM] Поиск контакта по Telegram ID: ${telegramId}`);
        
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
            return res.status(400).json({ message: 'telegramId обязателен' });
        }
        
        const amocrmService = require('../services/amocrm.service');
        console.log(`[AmoCRM] Поиск контакта по Telegram ID (query): ${telegramId}`);
        
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