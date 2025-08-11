const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

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
  authUrl.searchParams.set('scope', 'offline');
  authUrl.searchParams.set('state', state);

  return res.redirect(authUrl.toString());
});

module.exports = router;
