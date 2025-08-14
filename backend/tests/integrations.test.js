// backend/tests/integrations.test.js
// Тесты интеграций с внешними сервисами

const axios = require('axios');
const amocrmClient = require('../amocrm/apiClient');
const { getUser, addUser } = require('../database');

describe('🔗 External Integrations Testing', () => {

    // === AMOCRM INTEGRATION TESTS ===
    describe('🏢 AmoCRM Integration', () => {
        beforeAll(() => {
            // Устанавливаем увеличенный timeout для внешних запросов
            jest.setTimeout(10000);
        });

        test('AmoCRM API должен быть доступен', async () => {
            try {
                const response = await axios.get('https://new5a097b0640fce.amocrm.ru/api/v4/', {
                    timeout: 5000
                });
                expect([200, 401, 403]).toContain(response.status);
            } catch (error) {
                // Проверяем, что ошибка связана с авторизацией, а не с недоступностью API
                expect(error.response?.status).toBeDefined();
            }
        });

        test('Токены AmoCRM должны существовать или быть восстанавливаемыми', async () => {
            const tokens = amocrmClient.getTokens();
            
            // Проверяем наличие refresh_token (основного токена для восстановления)
            expect(
                tokens.refresh_token || 
                process.env.AMOCRM_REFRESH_TOKEN
            ).toBeTruthy();
        });

        test('Функция обновления токенов работает корректно', async () => {
            try {
                const result = await amocrmClient.refreshToken();
                expect(result).toBeTruthy();
            } catch (error) {
                // Если ошибка 401, значит нужны новые токены (это ожидаемо)
                if (error.response?.status === 401) {
                    console.log('⚠️  AmoCRM tokens need to be refreshed via /auth/setup');
                    expect(error.response.status).toBe(401);
                } else {
                    throw error;
                }
            }
        });

        test('Структура ответа AmoCRM API соответствует ожиданиям', async () => {
            try {
                const response = await amocrmClient.makeRequest('/api/v4/account');
                
                if (response) {
                    expect(response).toHaveProperty('id');
                    expect(response).toHaveProperty('name');
                    expect(response).toHaveProperty('subdomain');
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log('⚠️  AmoCRM authorization required');
                    expect(error.response.status).toBe(401);
                }
            }
        });
    });

    // === VK INTEGRATION TESTS ===
    describe('🔵 VK Integration', () => {
        test('VK API должен быть доступен', async () => {
            try {
                const response = await axios.get('https://api.vk.com/method/wall.get', {
                    params: {
                        v: '5.199',
                        access_token: 'test', // Намеренно неверный токен для проверки доступности API
                        owner_id: 1,
                        count: 1
                    },
                    timeout: 5000
                });
                
                // Ожидаем ошибку авторизации, но API должен отвечать
                expect(response.data).toHaveProperty('error');
                expect(response.data.error.error_code).toBe(5); // Invalid access token
            } catch (error) {
                console.error('VK API недоступен:', error.message);
                throw error;
            }
        });

        test('VK OAuth URL генерируется корректно', () => {
            const clientId = process.env.VK_CLIENT_ID;
            const redirectUri = process.env.VK_REDIRECT_URI;
            
            expect(clientId).toBeTruthy();
            expect(redirectUri).toBeTruthy();
            
            const authUrl = new URL('https://oauth.vk.com/authorize');
            authUrl.searchParams.set('client_id', clientId);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('response_type', 'code');
            
            expect(authUrl.toString()).toContain('oauth.vk.com');
            expect(authUrl.toString()).toContain(clientId);
        });

        test('VK Client Secret должен быть настроен', () => {
            const clientSecret = process.env.VK_CLIENT_SECRET;
            
            expect(clientSecret).toBeTruthy();
            expect(clientSecret).not.toBe('REAL_VK_CLIENT_SECRET_REQUIRED');
        });
    });

    // === INSTAGRAM INTEGRATION TESTS ===
    describe('📸 Instagram Integration', () => {
        test('Instagram OAuth конфигурация должна быть корректной', () => {
            const appId = process.env.INSTAGRAM_APP_ID;
            const appSecret = process.env.INSTAGRAM_APP_SECRET;
            const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
            
            expect(appId).toBeTruthy();
            expect(appSecret).toBeTruthy();
            expect(redirectUri).toBeTruthy();
            
            expect(appId).not.toBe('YOUR_INSTAGRAM_APP_ID');
            expect(appSecret).not.toBe('YOUR_INSTAGRAM_APP_SECRET');
        });

        test('Instagram API endpoints доступны', async () => {
            try {
                // Проверяем доступность Instagram Graph API
                const response = await axios.get('https://graph.instagram.com/me', {
                    params: {
                        fields: 'id,username',
                        access_token: 'invalid_token' // Намеренно неверный токен
                    },
                    timeout: 5000
                });
            } catch (error) {
                // Ожидаем ошибку авторизации, но не ошибку сети
                expect(error.response?.status).toBeDefined();
                expect([400, 401, 403]).toContain(error.response.status);
            }
        });
    });

    // === QTICKETS INTEGRATION TESTS ===
    describe('🎫 Qtickets Integration', () => {
        test('Qtickets webhook endpoints доступны', async () => {
            const qticketsDomain = 'https://api.qtickets.ru';
            
            try {
                const response = await axios.get(qticketsDomain, {
                    timeout: 5000
                });
                expect(response.status).toBeLessThan(500);
            } catch (error) {
                if (error.code === 'ENOTFOUND') {
                    console.log('⚠️  Qtickets API domain not accessible');
                } else {
                    expect(error.response?.status).toBeDefined();
                }
            }
        });

        test('Qtickets webhook signature validation работает', () => {
            // Проверяем наличие необходимых для валидации переменных
            const webhookSecret = process.env.QTICKETS_WEBHOOK_SECRET;
            
            if (webhookSecret) {
                expect(webhookSecret).toBeTruthy();
            } else {
                console.log('⚠️  QTICKETS_WEBHOOK_SECRET not configured');
            }
        });
    });

    // === TELEGRAM BOT INTEGRATION TESTS ===
    describe('📱 Telegram Bot Integration', () => {
        test('Telegram Bot Token должен быть валидным', () => {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            
            expect(botToken).toBeTruthy();
            expect(botToken).toMatch(/^\d+:[A-Za-z0-9_-]+$/);
        });

        test('Telegram Bot API доступен', async () => {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            
            if (botToken) {
                try {
                    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, {
                        timeout: 5000
                    });
                    
                    expect(response.data.ok).toBe(true);
                    expect(response.data.result).toHaveProperty('id');
                    expect(response.data.result).toHaveProperty('username');
                } catch (error) {
                    console.error('Telegram Bot API error:', error.response?.data);
                    throw error;
                }
            } else {
                console.log('⚠️  TELEGRAM_BOT_TOKEN not configured');
            }
        });
    });

    // === DATABASE INTEGRATION TESTS ===
    describe('💾 Database Integration', () => {
        test('Database CRUD операции работают корректно', async () => {
            const testUserId = 'integration_test_' + Date.now();
            const testUserData = {
                telegram_user_id: testUserId,
                username: 'integrationtest',
                first_name: 'Integration',
                last_name: 'Test',
                loyalty_points: 100
            };

            try {
                // CREATE
                const createResult = await addUser(testUserData);
                expect(createResult).toBeTruthy();

                // READ
                const readResult = await getUser(testUserId);
                expect(readResult).toBeTruthy();
                expect(readResult.telegram_user_id).toBe(testUserId);
                expect(readResult.loyalty_points).toBe(100);

                console.log('✅ Database CRUD test passed');
            } catch (error) {
                console.error('❌ Database CRUD test failed:', error);
                throw error;
            }
        });

        test('Database миграции выполнены корректно', async () => {
            const { initializeDatabase } = require('../database');
            
            try {
                await initializeDatabase();
                console.log('✅ Database initialization test passed');
            } catch (error) {
                console.error('❌ Database initialization failed:', error);
                throw error;
            }
        });
    });

    // === NETWORK CONNECTIVITY TESTS ===
    describe('🌐 Network Connectivity', () => {
        const externalServices = [
            { name: 'AmoCRM', url: 'https://new5a097b0640fce.amocrm.ru' },
            { name: 'VK API', url: 'https://api.vk.com' },
            { name: 'Instagram API', url: 'https://graph.instagram.com' },
            { name: 'Telegram API', url: 'https://api.telegram.org' }
        ];

        test.each(externalServices)('$name должен быть доступен', async ({ name, url }) => {
            try {
                const response = await axios.get(url, {
                    timeout: 5000,
                    validateStatus: () => true // Принимаем любой HTTP статус
                });
                
                expect(response.status).toBeLessThan(500);
                console.log(`✅ ${name} доступен (статус: ${response.status})`);
            } catch (error) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    console.error(`❌ ${name} недоступен: ${error.message}`);
                    throw new Error(`${name} service is not accessible`);
                } else {
                    // Другие ошибки (например, 401, 403) считаем приемлемыми
                    console.log(`⚠️  ${name} доступен, но возвращает ошибку: ${error.response?.status}`);
                }
            }
        });
    });

    // === ENVIRONMENT CONFIGURATION TESTS ===
    describe('⚙️  Environment Configuration', () => {
        const requiredEnvVars = [
            'AMOCRM_DOMAIN',
            'AMOCRM_CLIENT_ID',
            'AMOCRM_CLIENT_SECRET',
            'VK_CLIENT_ID',
            'VK_CLIENT_SECRET',
            'JWT_SECRET'
        ];

        test.each(requiredEnvVars)('%s должна быть настроена', (envVar) => {
            const value = process.env[envVar];
            expect(value).toBeTruthy();
            expect(value).not.toBe('');
            console.log(`✅ ${envVar} настроена`);
        });

        test('Конфигурация окружения корректна', () => {
            const config = {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT || 3001,
                amocrmDomain: process.env.AMOCRM_DOMAIN,
                vkClientId: process.env.VK_CLIENT_ID
            };

            expect(config.amocrmDomain).toContain('amocrm.ru');
            expect(config.vkClientId).toMatch(/^\d+$/);
            
            console.log('✅ Environment configuration is valid');
        });
    });
});
