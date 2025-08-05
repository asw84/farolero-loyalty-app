// backend/routes/order.routes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.post('/order', orderController.create);

module.exports = router;
