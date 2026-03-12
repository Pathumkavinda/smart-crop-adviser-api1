// routes/cultivations.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cultivationController');

// Create
router.post('/', ctrl.createCultivation);

// List (filters via query)
router.get('/', ctrl.getCultivations);

// Convenience filter: by user
router.get('/user/:user_id', ctrl.getByUserId);

// Read one
router.get('/:id', ctrl.getCultivationById);

// Update
router.put('/:id', ctrl.updateCultivation);

// Delete
router.delete('/:id', ctrl.deleteCultivation);

module.exports = router;
