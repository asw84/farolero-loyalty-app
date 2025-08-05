// backend/routes/webhook.routes.js

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Обратите внимание, что путь теперь более REST-подобный
router.post('/webhooks/qtickets', webhookController.handleQticketsWebhook);

module.exports = router;
