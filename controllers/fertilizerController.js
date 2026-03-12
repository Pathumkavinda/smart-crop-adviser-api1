// controllers/fertilizerController.js
const { Op } = require('sequelize');
const { Fertilizer, User } = require('../models');

const includeUser = [{ model: User, as: 'user', attributes: ['id','username','email','userlevel'] }];

// CREATE
exports.createFertilizer = async (req, res, next) => {
  try {
    const {
      user_id, crop, fertilizer_name, fertilizer_type,
      application_date, next_application_date, quantity,
      application_method, location, land_size, note
    } = req.body;

    if (!user_id || !crop || !fertilizer_name || !fertilizer_type || !application_date) {
      return res.status(400).json({ error: 'user_id, crop, fertilizer_name, fertilizer_type, application_date are required' });
    }

    const row = await Fertilizer.create({
      user_id,
      crop,
      fertilizer_name,
      fertilizer_type,
      application_date: new Date(application_date),
      next_application_date: next_application_date ? new Date(next_application_date) : null,
      quantity: quantity ?? null,
      application_method: application_method ?? null,
      location: location ?? null,
      land_size: land_size ?? null,
      note: note ?? null,
    });

    const withUser = await Fertilizer.findByPk(row.id, { include: includeUser });
    res.status(201).json(withUser);
  } catch (err) {
    console.error("Fertilizer create error:", err); // <-- Add this line
    next(err);
  }
};

// LIST (with filters)
exports.getFertilizers = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const { user_id, crop, fertilizer_type, date_from, date_to, q } = req.query;

    const where = {};
    if (user_id) where.user_id = Number(user_id);
    if (crop) where.crop = { [Op.like]: `%${crop}%` };
    if (fertilizer_type) where.fertilizer_type = String(fertilizer_type);

    if (date_from || date_to) {
      where.application_date = {};
      if (date_from) where.application_date[Op.gte] = new Date(date_from);
      if (date_to)   where.application_date[Op.lte] = new Date(date_to);
    }

    if (q) {
      const like = { [Op.like]: `%${q}%` };
      where[Op.or] = [
        { fertilizer_name: like },
        { application_method: like },
        { location: like },
        { note: like },
      ];
    }

    const { rows, count } = await Fertilizer.findAndCountAll({
      where,
      limit,
      offset,
      order: [['application_date', 'DESC'], ['id','DESC']],
      include: includeUser,
    });

    res.json({
      data: rows,
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    });
  } catch (err) { next(err); }
};

// READ ONE
exports.getFertilizerById = async (req, res, next) => {
  try {
    const row = await Fertilizer.findByPk(req.params.id, { include: includeUser });
    if (!row) return res.status(404).json({ error: 'Fertilizer record not found' });
    res.json(row);
  } catch (err) { next(err); }
};

// UPDATE
exports.updateFertilizer = async (req, res, next) => {
  try {
    const row = await Fertilizer.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Fertilizer record not found' });

    const payload = { ...req.body };
    if (payload.application_date) payload.application_date = new Date(payload.application_date);
    if (payload.next_application_date) payload.next_application_date = new Date(payload.next_application_date);

    await row.update(payload);
    const withUser = await Fertilizer.findByPk(row.id, { include: includeUser });
    res.json(withUser);
  } catch (err) { next(err); }
};

// DELETE
exports.deleteFertilizer = async (req, res, next) => {
  try {
    const row = await Fertilizer.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Fertilizer record not found' });
    await row.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

// CONVENIENCE: by user
exports.getByUserId = async (req, res, next) => {
  req.query.user_id = req.params.user_id ?? req.query.user_id;
  return exports.getFertilizers(req, res, next);
};
