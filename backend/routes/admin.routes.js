// backend/routes/admin.routes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

router.get('/admin/stats', adminController.getStats);
router.post('/admin/adjust-points', adminController.adjustPoints);

module.exports = router;
