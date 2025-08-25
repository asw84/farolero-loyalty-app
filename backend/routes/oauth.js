const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const amocrmClient = require('../amocrm/apiClient');
const { generateCodeVerifier, generateCodeChallenge } = require('../utils/pkce-helper');
const router = express.Router();

// DEBUG: Логирование всех запросов к /api/oauth
router.use((req, res, next) => {
    console.log(`[OAUTH_ROUTER] HIT: ${req.method} ${req.originalUrl}`);
    console.log(`[OAUTH_ROUTER] Path: ${req.path}`);
    console.log(`[OAUTH_ROUTER] Query:`, req.query);
    next();
});

router.get('/vk/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code || !state) return res.status(400).json({ error: 'missing_code_or_state' });

  try {
    console.log('DEBUG: VK callback received');
    console.log('DEBUG: Raw state from VK:', state);
    console.log('DEBUG: State length:', state.length);
    
    // Validate JWT state and extract code_verifier
    console.log('DEBUG: Attempting to URL decode and verify JWT state');
    const decodedState = decodeURIComponent(state);
    console.log('DEBUG: Decoded state:', decodedState);
    console.log('DEBUG: Decoded state length:', decodedState.length);
    
    // Декодируем из base64 обратно в JWT
    const restoredState = Buffer.from(decodedState, 'base64').toString('utf8');
    console.log('DEBUG: Restored JWT state:', restoredState);
    
    const decoded = jwt.verify(restoredState, process.env.JWT_SECRET);
    const { u: tg_user_id, v: code_verifier } = decoded;
    if (!tg_user_id || !code_verifier) return res.status(400).json({ error: 'invalid_state' });

    // Обменяем код на токен с новым VK ID API (POST запрос)
    const tokenParams = {
      client_id: process.env.VK_CLIENT_ID,
      code: code,
      code_verifier: code_verifier,
      redirect_uri: process.env.VK_REDIRECT_URI,
      device_id: `webapp_${Date.now()}` // Генерируем device_id
    };

    const { data } = await axios.post('https://id.vk.com/oauth2/auth', tokenParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { user_id } = data;

    // Find contact in AmoCRM and link VK ID
    const contact = await amocrmClient.findContactByTelegramId(tg_user_id);
    if (!contact) return res.status(404).json({ error: 'contact_not_found' });
    await amocrmClient.updateContact(contact.id, { [process.env.VK_ID_FIELD_ID]: user_id });

    return res.redirect(`${process.env.APP_BASE_URL}/miniapp/linked?vk_id=${user_id}`);
  } catch (err) {
    console.error('VK OAuth error:', err.response?.data || err.message);
    res.status(500).json({ error: 'oauth_vk_failed' });
  }
});

// Добавляем роут для VK OAuth login
router.get('/vk/login', async (req, res) => {
  const { tg_user_id } = req.query;
  
  if (!tg_user_id) {
    return res.status(400).json({ error: 'missing_tg_user_id' });
  }

  try {
    // Генерируем PKCE параметры
    const code_verifier = generateCodeVerifier();
    const code_challenge = generateCodeChallenge(code_verifier);
    
    // Создаем JWT токен для state с code_verifier (сокращенные ключи) 
    const state = jwt.sign({ 
      u: tg_user_id,     // u = user
      v: code_verifier   // v = verifier
    }, process.env.JWT_SECRET, { expiresIn: '5m' });
    
    // Формируем URL для авторизации VK ID (новый API)
    const authUrl = new URL('https://id.vk.com/authorize');
    authUrl.searchParams.set('client_id', process.env.VK_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.VK_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    // Кодируем весь JWT в base64 для безопасной передачи через URL
    const safeState = Buffer.from(state).toString('base64');
    authUrl.searchParams.set('state', encodeURIComponent(safeState));
    authUrl.searchParams.set('scope', 'offline');
    authUrl.searchParams.set('code_challenge', code_challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    // Перенаправляем на страницу авторизации VK ID
    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error('VK OAuth login error:', err.message);
    res.status(500).json({ error: 'oauth_vk_login_failed' });
  }
});

module.exports = router;
