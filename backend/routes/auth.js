const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const instagramController = require('../controllers/instagram.controller');

// Instagram OAuth
router.get('/instagram/login', instagramController.initiateLogin);

// AmoCRM setup interface
router.get('/setup', authController.showSetupPage);

// API для работы с токенами AmoCRM
router.post('/save-code', authController.saveAuthCode);
router.post('/get-tokens', authController.getTokens);
router.get('/download-tokens', authController.downloadTokens);
router.get('/show-tokens', authController.showTokens);
router.post('/upload-tokens', authController.uploadTokens);

module.exports = router;
