// backend/tests/api.test.js

const request = require('supertest');
const express = require('express');
const walkRoutes = require('../routes/walk.routes');
const userRoutes = require('../routes/user.routes');
const orderRoutes = require('../routes/order.routes');
const orderController = require('../controllers/order.controller');

// Моки для сервисов, чтобы не делать реальные запросы
jest.mock('../services/walk.service', () => ({
    getAllWalks: jest.fn(() => [{ id: 1, title: 'Test Walk' }]),
    getWalkById: jest.fn(id => (id == 1 ? { id: 1, title: 'Test Walk' } : null)),
}));

jest.mock('../services/user.service', () => ({
    getUserData: jest.fn(id => (id == 123 ? { points: 100 } : null)),
}));

jest.mock('../services/order.service', () => ({
    createOrder: jest.fn(() => ({ orderUrl: 'http://test.url' })),
}));

const app = express();
app.use(express.json());

// Инициализация
const WALK_URLS = { 1: 'http://test.url' };
orderController.init(WALK_URLS);

app.use('/api', walkRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);

describe('API Endpoints', () => {

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
        it('GET /api/user/:telegramId - should return user data for a valid ID', async () => {
            const res = await request(app).get('/api/user/123');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('points', 100);
        });

        it('GET /api/user/:telegramId - should return 404 for an invalid ID', async () => {
            const res = await request(app).get('/api/user/999');
            expect(res.statusCode).toEqual(404);
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

});
