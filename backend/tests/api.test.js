// backend/tests/api.test.js

const request = require('supertest');
const express = require('express');
const walkRoutes = require('../routes/walk.routes');
const userRoutes = require('../routes/user.routes');
const orderRoutes = require('../routes/order.routes');
const webhookRoutes = require('../routes/webhook.routes');
const adminRoutes = require('../routes/admin.routes');
const socialRoutes = require('../routes/social.routes');
const amocrmRoutes = require('../routes/amocrm.routes');
const vkRoutes = require('../routes/vk.routes');
const instagramRoutes = require('../routes/instagram.routes');
const vkOAuthRoutes = require('../routes/vk.oauth.routes');
const orderController = require('../controllers/order.controller');
const webhookService = require('../services/webhook.service');

// Моки для сервисов, чтобы не делать реальные запросы
jest.mock('../database', () => ({
    initializeDatabase: jest.fn(),
    findUserByTelegramId: jest.fn()
        .mockResolvedValueOnce(null) // First call for new user
        .mockResolvedValue({ id: 2, telegram_user_id: '999', points: 100, synced_with_amo: 0 }), // Subsequent calls
    findOrCreateUser: jest.fn((id, type) => Promise.resolve({ id: 2, [type]: id, points: 100 })),
    updateUser: jest.fn(() => Promise.resolve()),
    addPoints: jest.fn(() => Promise.resolve()),
    setPendingPointsDeduction: jest.fn(() => Promise.resolve()),
    deductPendingPoints: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/walk.service', () => ({
    getAllWalks: jest.fn(() => [{ id: 1, title: 'Test Walk' }]),
    getWalkById: jest.fn(id => (id == 1 ? { id: 1, title: 'Test Walk', price: 1000 } : null)),
}));


jest.mock('../services/order.service', () => ({
    createOrder: jest.fn(() => ({ orderUrl: 'http://test.url' })),
}));

jest.mock('../services/webhook.service', () => ({
    handleSuccessfulPayment: jest.fn(() => ({ success: true, message: 'OK' })),
}));

jest.mock('../services/admin.service', () => ({
    getStats: jest.fn(() => ({ totalUsers: 100 })),
    adjustPoints: jest.fn(() => ({ success: true, newTotalPoints: 200 })),
    searchUsers: jest.fn(() => ([{ id: 1, telegram_user_id: '123', points: 100 }])),
    getUserDetails: jest.fn(() => ({ user: { id: 1, telegram_user_id: '123', points: 100 }, activities: [] })),
    getTopUsers: jest.fn(() => ([{ id: 1, telegram_user_id: '123', points: 100 }])),
}));

jest.mock('../services/social.service', () => ({
    checkSubscription: jest.fn(() => ({ success: true })),
}));

jest.mock('../amocrm/apiClient', () => ({
    getInitialToken: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/vk.service', () => ({
    handleNewWallReply: jest.fn(() => ({ success: true })),
}));

jest.mock('../services/instagram.service', () => ({
    handleOAuthCallback: jest.fn(() => ({ success: true, message: 'Аккаунт Instagram успешно привязан!' })),
}));

// Обновленный мок для vk.oauth.service
jest.mock('../services/vk.oauth.service', () => ({
    verifyAndLinkAccount: jest.fn(() => Promise.resolve({ success: true, message: 'Аккаунт VK ID успешно привязан!' }))
}));

jest.mock('../services/amocrm.service.js', () => ({
    findContactByTelegramId: jest.fn(() => Promise.resolve(null)),
    extractPointsFromContact: jest.fn(() => 0),
}));

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Инициализация
const WALK_URLS = { 1: 'http://test.url' };
orderController.init(WALK_URLS);

app.use('/api', walkRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', webhookRoutes);
app.use('/api', adminRoutes);
app.use('/api', socialRoutes);
app.use('/api/amocrm', amocrmRoutes);
app.use('/api', vkRoutes);
app.use('/api', instagramRoutes);
app.use('/api', vkOAuthRoutes);

describe('API Endpoints', () => {

    let adminToken = '';

    beforeAll(async () => {
        // Login as admin to get token
        const res = await request(app)
            .post('/api/admin/login')
            .send({ password: 'admin' }); // Use the password set in .env
        adminToken = res.body.token;
    });

    // Тесты для Walks API
    describe('Walks API', () => {
        it('GET /api/walks - should return a list of walks', async () => {
            const res = await request(app).get('/api/walks');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body[0]).toHaveProperty('title', 'Test Walk');
        });

        it('GET /api/walk/:id - should return walk details for a valid ID', async () => {
            const res = await request(app).get('/api/walk/1');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('id', 1);
        });

        it('GET /api/walk/:id - should return 404 for an invalid ID', async () => {
            const res = await request(app).get('/api/walk/999');
            expect(res.statusCode).toEqual(404);
        });
    });

    // Тесты для User API
    describe('User API', () => {
        it('POST /api/user - should return user data for a valid ID', async () => {
            const res = await request(app)
                .post('/api/user')
                .send({ telegramId: '123' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('points', 100);
        });

        it('POST /api/user - should create a new user if not found', async () => {
            const res = await request(app)
                .post('/api/user')
                .send({ telegramId: '999' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('points', 100); // Наш мок возвращает 100
        });
    });

    // Тесты для Order API
    describe('Order API', () => {
        it('POST /api/order - should create an order and return a URL', async () => {
            const res = await request(app)
                .post('/api/order')
                .send({ telegramId: 123, walkId: 1 });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('orderUrl', 'http://test.url');
        });

        it('POST /api/order - should return 400 if telegramId or walkId is missing', async () => {
            const res = await request(app)
                .post('/api/order')
                .send({ telegramId: 123 }); // Отсутствует walkId
            expect(res.statusCode).toEqual(400);
        });
    });

    // Тесты для Webhook API
    describe('Webhook API', () => {
        it('POST /api/webhooks/qtickets - should return 200 for a valid paid event', async () => {
            const payload = { client: { details: { telegram_user: { id: 123 } } } };
            const signature = require('crypto').createHmac('sha1', process.env.QTICKETS_WEBHOOK_SECRET).update(JSON.stringify(payload)).digest('hex');

            const res = await request(app)
                .post('/api/webhooks/qtickets')
                .set('x-event-type', 'payed')
                .set('x-signature', signature)
                .send(payload);
            
            expect(res.statusCode).toEqual(200);
            expect(webhookService.handleSuccessfulPayment).toHaveBeenCalled();
        });

        it('POST /api/webhooks/qtickets - should return 403 for an invalid signature', async () => {
            const res = await request(app)
                .post('/api/webhooks/qtickets')
                .set('x-event-type', 'payed')
                .set('x-signature', 'invalid_signature')
                .send({});
            
            expect(res.statusCode).toEqual(403);
        });

        it('POST /api/webhooks/qtickets - should return 200 and skip non-paid events', async () => {
            const payload = {};
            const signature = require('crypto').createHmac('sha1', process.env.QTICKETS_WEBHOOK_SECRET).update(JSON.stringify(payload)).digest('hex');

            const res = await request(app)
                .post('/api/webhooks/qtickets')
                .set('x-event-type', 'created') // Не 'payed'
                .set('x-signature', signature)
                .send(payload);
            
            expect(res.statusCode).toEqual(200);
            expect(webhookService.handleSuccessfulPayment).not.toHaveBeenCalled();
        });
    });

    // Тесты для Admin API
    describe('Admin API', () => {
        it('GET /api/admin/stats - should return stats', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('totalUsers', 100);
        });

        it('POST /api/admin/adjust-points - should adjust points', async () => {
            const res = await request(app)
                .post('/api/admin/adjust-points')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ telegramId: 123, points: 100, reason: 'Test' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('newTotalPoints', 200);
        });

        it('GET /api/admin/users - should search users', async () => {
            const res = await request(app)
                .get('/api/admin/users?username=123')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body[0]).toHaveProperty('telegram_user_id', '123');
        });

        it('GET /api/admin/users/:id - should return user details', async () => {
            const res = await request(app)
                .get('/api/admin/users/1')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id', 1);
        });

        it('GET /api/admin/top-users - should return top users', async () => {
            const res = await request(app)
                .get('/api/admin/top-users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body[0]).toHaveProperty('points');
        });
    });

    // Тесты для Social API
    describe('Social API', () => {
        it('POST /api/social/check-subscription - should return success', async () => {
            const res = await request(app)
                .post('/api/social/check-subscription')
                .send({ telegramId: 123, socialNetwork: 'telegram' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
        });
    });

    // Тесты для AmoCRM API
    describe('AmoCRM API', () => {
        it('GET /api/amocrm/init - should return a success message', async () => {
            const res = await request(app).get('/api/amocrm/init');
            expect(res.statusCode).toEqual(200);
            expect(res.text).toContain('успешно получены');
        });
    });

    // Тесты для VK Callback API
    describe('VK Callback API', () => {
        const vkService = require('../services/vk.service');

        it('POST /api/webhooks/vk - should handle confirmation', async () => {
            const res = await request(app)
                .post('/api/webhooks/vk')
                .send({ type: 'confirmation', secret: process.env.VK_SECRET_KEY });
            
            expect(res.statusCode).toEqual(200);
            expect(res.text).toBe(process.env.VK_CONFIRMATION_TOKEN);
        });

        it('POST /api/webhooks/vk - should handle new wall reply', async () => {
            const res = await request(app)
                .post('/api/webhooks/vk')
                .send({ type: 'wall_reply_new', object: { from_id: 123, text: 'test' }, secret: process.env.VK_SECRET_KEY });
            
            expect(res.statusCode).toEqual(200);
            expect(res.text).toBe('ok');
            expect(vkService.handleNewWallReply).toHaveBeenCalled();
        });

        it('POST /api/webhooks/vk - should return 403 for invalid secret', async () => {
            const res = await request(app)
                .post('/api/webhooks/vk')
                .send({ type: 'confirmation', secret: 'invalid_secret' });
            
            expect(res.statusCode).toEqual(403);
        });
    });

    // Тесты для Instagram OAuth
    describe('Instagram OAuth', () => {
        const instagramService = require('../services/instagram.service');

        it('GET /api/oauth/instagram/callback - should handle a valid code', async () => {
            const res = await request(app).get('/api/oauth/instagram/callback?code=valid_code');
            
            expect(res.statusCode).toEqual(200);
            expect(res.text).toBe('Аккаунт Instagram успешно привязан!');
            expect(instagramService.handleOAuthCallback).toHaveBeenCalledWith('valid_code', '123456789');
        });

        it('GET /api/oauth/instagram/callback - should return 400 if code is missing', async () => {
            const res = await request(app).get('/api/oauth/instagram/callback');
            
            expect(res.statusCode).toEqual(400);
            expect(res.text).toContain('Ошибка: отсутствует код авторизации');
        });
    });

    // Новые тесты для верификации VK ID
    describe('VK ID Verification', () => {
        const vkOAuthService = require('../services/vk.oauth.service');

        it('POST /api/oauth/vk/verify-auth - should return success for valid data', async () => {
            const payload = {
                vkData: { uuid: '12345', token: 'valid_token' },
                telegramId: '67890'
            };

            const res = await request(app)
                .post('/api/oauth/vk/verify-auth')
                .send(payload);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(vkOAuthService.verifyAndLinkAccount).toHaveBeenCalledWith(payload.vkData, payload.telegramId);
        });

        it('POST /api/oauth/vk/verify-auth - should return 400 if payload is missing', async () => {
            const res = await request(app)
                .post('/api/oauth/vk/verify-auth')
                .send({ telegramId: '67890' }); // Отсутствует vkData
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Отсутствуют необходимые данные');
        });
    });

});