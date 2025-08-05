// backend/routes/walk.routes.js

const express = require('express');
const router = express.Router();
const walkController = require('../controllers/walk.controller');

router.get('/walks', walkController.getWalks);
router.get('/walk/:id', walkController.getWalkDetails);

module.exports = router;
