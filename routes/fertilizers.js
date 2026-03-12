// routes/fertilizers.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fertilizerController');

// Create
router.post('/', ctrl.createFertilizer);

// List (filters via query)
router.get('/', ctrl.getFertilizers);

// Convenience filter
router.get('/user/:user_id', ctrl.getByUserId);

// Read one
router.get('/:id', ctrl.getFertilizerById);

// Update
router.put('/:id', ctrl.updateFertilizer);

// Delete
router.delete('/:id', ctrl.deleteFertilizer);

module.exports = router;
