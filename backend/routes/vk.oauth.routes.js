// backend/routes/vk.oauth.routes.js

const express = require('express');
const router = express.Router();
const vkOAuthController = require('../controllers/vk.oauth.controller');

router.get('/oauth/vk/callback', vkOAuthController.handleCallback);

module.exports = router;
