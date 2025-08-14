// backend/tests/api.test.js
// Комплексные тесты API endpoints

const request = require('supertest');
const app = require('../server');

describe('🔥 API Endpoints Testing', () => {

    // === HEALTHCHECK TESTS ===
    describe('🩺 Health Check', () => {
        test('GET /health должен возвращать статус OK', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    // === DATABASE TESTS ===
    describe('💾 Database Connection', () => {
        test('База данных должна быть доступна', async () => {
            const response = await request(app)
                .get('/api/test/db')
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });
    });

    // === USER MANAGEMENT TESTS ===
    describe('👤 User Management', () => {
        const testUser = {
            telegram_user_id: 'test_' + Date.now(),
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User'
        };

        test('POST /api/users - создание пользователя', async () => {
            const response = await request(app)
                .post('/api/users')
                .send(testUser)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('telegram_user_id', testUser.telegram_user_id);
        });

        test('GET /api/users/:id - получение пользователя', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser.telegram_user_id}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('telegram_user_id', testUser.telegram_user_id);
        });

        test('PUT /api/users/:id - обновление пользователя', async () => {
            const updateData = { first_name: 'Updated Test' };
            
            const response = await request(app)
                .put(`/api/users/${testUser.telegram_user_id}`)
                .send(updateData)
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });
    });

    // === REFERRAL SYSTEM TESTS ===
    describe('🎯 Referral System', () => {
        const referrerTelegramId = 'referrer_' + Date.now();
        let referralCode;

        beforeAll(async () => {
            // Создаем тестового пользователя-реферера
            await request(app)
                .post('/api/users')
                .send({
                    telegram_user_id: referrerTelegramId,
                    username: 'referrer',
                    first_name: 'Referrer',
                    last_name: 'User'
                });
        });

        test('POST /api/referral/generate - генерация реферального кода', async () => {
            const response = await request(app)
                .post('/api/referral/generate')
                .send({ telegram_id: referrerTelegramId })
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('referral_code');
            expect(response.body).toHaveProperty('qr_code');
            
            referralCode = response.body.referral_code;
        });

        test('GET /api/referral/stats/:telegram_id - статистика рефералов', async () => {
            const response = await request(app)
                .get(`/api/referral/stats/${referrerTelegramId}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.stats).toHaveProperty('total_referrals');
            expect(response.body.stats).toHaveProperty('active_referrals');
        });

        test('POST /api/referral/activate - активация реферального кода', async () => {
            const refereeTelegramId = 'referee_' + Date.now();
            
            // Создаем тестового реферала
            await request(app)
                .post('/api/users')
                .send({
                    telegram_user_id: refereeTelegramId,
                    username: 'referee',
                    first_name: 'Referee',
                    last_name: 'User'
                });

            const response = await request(app)
                .post('/api/referral/activate')
                .send({
                    referral_code: referralCode,
                    referee_telegram_id: refereeTelegramId
                })
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });
    });

    // === RFM ANALYTICS TESTS ===
    describe('📊 RFM Analytics', () => {
        test('GET /api/analytics/rfm - получение RFM сегментов', async () => {
            const response = await request(app)
                .get('/api/analytics/rfm')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.segments)).toBe(true);
        });

        test('POST /api/analytics/rfm/calculate - пересчет RFM', async () => {
            const response = await request(app)
                .post('/api/analytics/rfm/calculate')
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });

        test('GET /api/analytics/dashboard - данные дашборда', async () => {
            const response = await request(app)
                .get('/api/analytics/dashboard')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('total_users');
            expect(response.body).toHaveProperty('total_referrals');
        });
    });

    // === AUTH SYSTEM TESTS ===
    describe('🔐 Authentication System', () => {
        test('GET /auth/setup - страница настройки должна загружаться', async () => {
            const response = await request(app)
                .get('/auth/setup')
                .expect(200);
            
            expect(response.text).toContain('Настройка AmoCRM');
        });

        test('POST /auth/save-code - сохранение кода авторизации', async () => {
            const response = await request(app)
                .post('/auth/save-code')
                .send({ authCode: 'test_auth_code_123' })
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });

        test('GET /auth/show-tokens - просмотр токенов', async () => {
            const response = await request(app)
                .get('/auth/show-tokens')
                .expect(200);
            
            expect(response.body).toHaveProperty('success');
        });
    });

    // === ORDER PROCESSING TESTS ===
    describe('🛒 Order Processing', () => {
        test('POST /api/orders - создание заказа', async () => {
            const orderData = {
                user_telegram_id: 'test_user_' + Date.now(),
                amount: 1000,
                source: 'qtickets',
                order_id: 'test_order_' + Date.now()
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
        });
    });

    // === ERROR HANDLING TESTS ===
    describe('❌ Error Handling', () => {
        test('GET /nonexistent - должен возвращать 404', async () => {
            await request(app)
                .get('/nonexistent')
                .expect(404);
        });

        test('POST /api/users - невалидные данные должны возвращать 400', async () => {
            await request(app)
                .post('/api/users')
                .send({}) // пустой объект
                .expect(400);
        });

        test('GET /api/users/nonexistent - несуществующий пользователь должен возвращать 404', async () => {
            await request(app)
                .get('/api/users/nonexistent_user_id')
                .expect(404);
        });
    });

    // === PERFORMANCE TESTS ===
    describe('⚡ Performance Tests', () => {
        test('Время ответа API должно быть < 1000ms', async () => {
            const start = Date.now();
            
            await request(app)
                .get('/health')
                .expect(200);
            
            const responseTime = Date.now() - start;
            expect(responseTime).toBeLessThan(1000);
        });

        test('Массовые запросы должны обрабатываться стабильно', async () => {
            const promises = [];
            
            for (let i = 0; i < 10; i++) {
                promises.push(
                    request(app)
                        .get('/health')
                        .expect(200)
                );
            }
            
            const results = await Promise.all(promises);
            expect(results).toHaveLength(10);
        });
    });
});

// === INTEGRATION TESTS ===
describe('🔗 Integration Tests', () => {
    describe('AmoCRM Integration', () => {
        test('GET /api/amocrm/test - проверка подключения к AmoCRM', async () => {
            const response = await request(app)
                .get('/api/amocrm/test')
                .timeout(5000);
            
            // Может вернуть как успех, так и ошибку (если токены не настроены)
            expect([200, 401, 500]).toContain(response.status);
        });
    });

    describe('Database Consistency', () => {
        test('Целостность данных после операций CRUD', async () => {
            const testUserId = 'consistency_test_' + Date.now();
            
            // CREATE
            await request(app)
                .post('/api/users')
                .send({
                    telegram_user_id: testUserId,
                    username: 'consistencytest',
                    first_name: 'Consistency',
                    last_name: 'Test'
                })
                .expect(201);
            
            // READ
            const readResponse = await request(app)
                .get(`/api/users/${testUserId}`)
                .expect(200);
            
            expect(readResponse.body.user.telegram_user_id).toBe(testUserId);
            
            // UPDATE
            await request(app)
                .put(`/api/users/${testUserId}`)
                .send({ first_name: 'Updated' })
                .expect(200);
            
            // VERIFY UPDATE
            const updatedResponse = await request(app)
                .get(`/api/users/${testUserId}`)
                .expect(200);
            
            expect(updatedResponse.body.user.first_name).toBe('Updated');
        });
    });
});