// controllers/appointmentController.js
const { Op } = require('sequelize');
const { Appointment, User } = require('../models');

const baseIncludes = [
  { model: User, as: 'farmer', attributes: ['id','username','email','userlevel'] },
  { model: User, as: 'adviser', attributes: ['id','username','email','userlevel'] },
];

// Create
exports.createAppointment = async (req, res, next) => {
  try {
    const {
      farmer_id, adviser_id, subject,
      appointment_date, duration_minutes,
      location, message, appointment_status
    } = req.body;

    if (!farmer_id || !adviser_id || !subject || !appointment_date) {
      return res.status(400).json({ error: 'farmer_id, adviser_id, subject, appointment_date are required' });
    }

    const appt = await Appointment.create({
      farmer_id,
      adviser_id,
      subject,
      appointment_date: new Date(appointment_date),
      duration_minutes: duration_minutes ?? 30,
      location: location ?? null,
      message: message ?? null,
      appointment_status: appointment_status ?? 'pending'
    });

    const withIncludes = await Appointment.findByPk(appt.id, { include: baseIncludes });
    res.status(201).json(withIncludes);
  } catch (err) { next(err); }
};

// Read list (with filters)
exports.getAppointments = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = {};
    const {
      farmer_id, adviser_id, user_id,
      status, date_from, date_to, q
    } = req.query;

    if (farmer_id) where.farmer_id = Number(farmer_id);
    if (adviser_id) where.adviser_id = Number(adviser_id);

    // user_id = either farmer or adviser
    if (user_id) {
      where[Op.or] = [
        { farmer_id: Number(user_id) },
        { adviser_id: Number(user_id) }
      ];
    }

    if (status) where.appointment_status = String(status);

    if (date_from || date_to) {
      where.appointment_date = {};
      if (date_from) where.appointment_date[Op.gte] = new Date(date_from);
      if (date_to)   where.appointment_date[Op.lte] = new Date(date_to);
    }

    if (q) {
      const like = { [Op.like]: `%${q}%` };
      where[Op.or] = (where[Op.or] ?? []).concat([
        { subject: like },
        { location: like },
        { message: like },
      ]);
    }

    const { rows, count } = await Appointment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['appointment_date', 'DESC'], ['id','DESC']],
      include: baseIncludes,
    });

    res.json({
      data: rows,
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit)
    });
  } catch (err) { next(err); }
};

// Read one
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appt = await Appointment.findByPk(req.params.id, { include: baseIncludes });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) { next(err); }
};

// Update
exports.updateAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const payload = { ...req.body };
    if (payload.appointment_date) payload.appointment_date = new Date(payload.appointment_date);

    await appt.update(payload);
    const withIncludes = await Appointment.findByPk(appt.id, { include: baseIncludes });
    res.json(withIncludes);
  } catch (err) { next(err); }
};

// Delete
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    await appt.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Convenience: by farmer
exports.getByFarmerId = async (req, res, next) => {
  req.query.farmer_id = req.params.farmer_id ?? req.query.farmer_id;
  return exports.getAppointments(req, res, next);
};

// Convenience: by adviser
exports.getByAdviserId = async (req, res, next) => {
  req.query.adviser_id = req.params.adviser_id ?? req.query.adviser_id;
  return exports.getAppointments(req, res, next);
};

// Convenience: by user (either side)
exports.getByUserId = async (req, res, next) => {
  req.query.user_id = req.params.user_id ?? req.query.user_id;
  return exports.getAppointments(req, res, next);
};
