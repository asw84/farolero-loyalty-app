// backend/routes/admin.routes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

const ADMIN_TOKEN = 'supersecrettoken';

// Middleware for authentication
const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
};

router.post('/admin/login', (req, res) => {
    const { password } = req.body;
    // Use environment variable if set, otherwise fall back to default 'admin' password
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin';
    if (password === expectedPassword) {
        res.json({ token: ADMIN_TOKEN });
    } else {
        res.status(401).send('Invalid password');
    }
});

router.get('/admin/top-users', isAuthenticated, adminController.getTopUsers);
router.get('/admin/users', isAuthenticated, adminController.searchUsers);
router.get('/admin/users/:id', isAuthenticated, adminController.getUserDetails);
router.get('/admin/stats', isAuthenticated, adminController.getStats);
router.get('/admin/registration-stats', isAuthenticated, adminController.getUserRegistrationStats);
router.get('/admin/points-distribution', isAuthenticated, adminController.getPointsDistribution);
router.get('/admin/activity-stats', isAuthenticated, adminController.getActivityStats);
router.get('/admin/daily-activity', isAuthenticated, adminController.getDailyActivityStats);
router.post('/admin/adjust-points', isAuthenticated, adminController.adjustPoints);

module.exports = router;
