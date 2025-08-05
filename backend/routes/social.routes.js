// backend/routes/social.routes.js

const express = require('express');
const router = express.Router();
const socialController = require('../controllers/social.controller');

router.post('/social/check-subscription', socialController.checkSubscription);

module.exports = router;
