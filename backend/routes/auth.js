const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const instagramController = require('../controllers/instagram.controller');

// VK OAuth (существующий функционал)
router.get('/vk/login', (req, res) => {
  const { tg_user_id } = req.query;
  if (!tg_user_id) return res.status(400).json({ error: 'missing_tg_id' });

  const state = jwt.sign({ tg_user_id }, process.env.JWT_SECRET, { expiresIn: '10m' });

  const authUrl = new URL('https://oauth.vk.com/authorize');
  authUrl.searchParams.set('client_id', process.env.VK_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', process.env.VK_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('v', '5.199');
  authUrl.searchParams.set('display', 'page');
  authUrl.searchParams.set('state', state);
  console.log('VK OAuth URL:', authUrl.toString());
  return res.redirect(authUrl.toString());
});

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
