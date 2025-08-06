const express = require('express');
const router = express.Router();
const walkController = require('../controllers/walk.controller');

router.get('/walks', walkController.getWalks);

// Было: /walk/:
// Стало: /walk/:id
router.get('/walk/:id', walkController.getWalkDetails);

module.exports = router;