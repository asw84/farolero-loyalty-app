const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const amocrmClient = require('../amocrm/apiClient');
const router = express.Router();

router.get('/vk/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).json({ error: 'missing_code_or_state' });

  try {
    const params = new URLSearchParams({
      client_id: process.env.VK_CLIENT_ID,
      client_secret: process.env.VK_CLIENT_SECRET,
      redirect_uri: process.env.VK_REDIRECT_URI,
      code
    });

    const { data } = await axios.get(`https://oauth.vk.com/access_token?${params.toString()}`);
    const { user_id } = data;

    // Validate JWT state
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const tg_user_id = decoded?.tg_user_id;
    if (!tg_user_id) return res.status(400).json({ error: 'invalid_state' });

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
  if (!tg_user_id) return res.status(400).json({ error: 'missing_tg_user_id' });

  try {
    // Создаем JWT токен для state
    const state = jwt.sign({ tg_user_id }, process.env.JWT_SECRET, { expiresIn: '10m' });
    
    // Формируем URL для авторизации VK
    const authUrl = new URL('https://oauth.vk.com/authorize');
    authUrl.searchParams.set('client_id', process.env.VK_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.VK_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'offline');
    
    // Перенаправляем на страницу авторизации VK
    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error('VK OAuth login error:', err.message);
    res.status(500).json({ error: 'oauth_vk_login_failed' });
  }
});

module.exports = router;
