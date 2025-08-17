// backend/routes/health.routes.js
// Простой health check для системы

const express = require('express');
const router = express.Router();

/**
 * GET /api/health - Простой health check только для базы данных
 */
router.get('/', async (req, res) => {
    try {
        // Проверяем только соединение с БД
        const { dbGet } = require('../database');
        let dbOk = false;
        
        try {
            await dbGet('SELECT 1 as test');
            dbOk = true;
            console.log('[Health] ✅ Database check passed');
        } catch (dbError) {
            console.error('[Health] ❌ Database check failed:', dbError);
            dbOk = false;
        }
        
        const health = {
            status: dbOk ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbOk ? 'healthy' : 'unhealthy',
                environment: process.env.NODE_ENV || 'development'
            }
        };
        
        const statusCode = dbOk ? 200 : 503;
        res.status(statusCode).json(health);
        
    } catch (error) {
        console.error('[Health] ❌ Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * GET /api/health/simple - Очень простой health check
 */
router.get('/simple', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Server is running'
    });
});

module.exports = router;
