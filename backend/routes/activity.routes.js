// backend/routes/activity.routes.js

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

// GET /api/activity - получить активность всех пользователей (для админов)
router.get('/activity', activityController.getAllActivity);

// GET /api/activity/:userId - получить активность конкретного пользователя
router.get('/activity/:userId', activityController.getUserActivity);

module.exports = router;
