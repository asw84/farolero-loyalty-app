// backend/controllers/walk.controller.js

const walkService = require('../services/walk.service');

function getWalks(req, res) {
    const walks = walkService.getAllWalks();
    res.json(walks);
}

function getWalkDetails(req, res) {
    const { id } = req.params;
    const walk = walkService.getWalkById(id);
    if (walk) {
        res.json(walk);
    } else {
        res.status(404).json({ message: 'Прогулка не найдена' });
    }
}

module.exports = {
    getWalks,
    getWalkDetails,
};
