// backend/routes/amocrm.routes.js

const express = require('express');
const router = express.Router();
const amocrmController = require('../controllers/amocrm.controller');

router.get('/amocrm/init', amocrmController.init);

module.exports = router;
