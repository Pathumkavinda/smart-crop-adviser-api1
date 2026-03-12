// routes/appointments.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointmentController');

// POST /appointments
router.post('/', ctrl.createAppointment);

// GET /appointments (list with filters)
router.get('/', ctrl.getAppointments);

// GET /appointments/:id
router.get('/:id', ctrl.getAppointmentById);

// PUT /appointments/:id
router.put('/:id', ctrl.updateAppointment);

// DELETE /appointments/:id
router.delete('/:id', ctrl.deleteAppointment);

// Filters
router.get('/farmer/:farmer_id', ctrl.getByFarmerId);
router.get('/adviser/:adviser_id', ctrl.getByAdviserId);
router.get('/user/:user_id', ctrl.getByUserId);

module.exports = router;
