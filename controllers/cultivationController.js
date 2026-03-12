// controllers/cultivationController.js
const { Op } = require('sequelize');
const { Cultivation, User } = require('../models');

const includeUser = [{ model: User, as: 'user', attributes: ['id','username','email','userlevel'] }];

// CREATE
exports.createCultivation = async (req, res, next) => {
  try {
    const {
      user_id, crop, location, land_size, status,
      planning_date, expected_harvest_date, note
    } = req.body;

    if (!user_id || !crop || !planning_date) {
      return res.status(400).json({ error: 'user_id, crop, planning_date are required' });
    }

    const row = await Cultivation.create({
      user_id,
      crop,
      location: location ?? null,
      land_size: land_size ?? null,
      status: status ?? 'planning',
      planning_date: new Date(planning_date),
      expected_harvest_date: expected_harvest_date ? new Date(expected_harvest_date) : null,
      note: note ?? null,
    });

    const withUser = await Cultivation.findByPk(row.id, { include: includeUser });
    res.status(201).json(withUser);
  } catch (err) { next(err); }
};

// LIST (filters)
exports.getCultivations = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const {
      user_id, crop, status,
      plan_from, plan_to,
      harvest_from, harvest_to,
      q
    } = req.query;

    const where = {};
    if (user_id) where.user_id = Number(user_id);
    if (crop) where.crop = { [Op.like]: `%${crop}%` };
    if (status) where.status = String(status);

    if (plan_from || plan_to) {
      where.planning_date = {};
      if (plan_from) where.planning_date[Op.gte] = new Date(plan_from);
      if (plan_to)   where.planning_date[Op.lte] = new Date(plan_to);
    }

    if (harvest_from || harvest_to) {
      where.expected_harvest_date = where.expected_harvest_date || {};
      if (harvest_from) where.expected_harvest_date[Op.gte] = new Date(harvest_from);
      if (harvest_to)   where.expected_harvest_date[Op.lte] = new Date(harvest_to);
    }

    if (q) {
      const like = { [Op.like]: `%${q}%` };
      where[Op.or] = [
        { location: like },
        { land_size: like },
        { note: like },
      ];
    }

    const { rows, count } = await Cultivation.findAndCountAll({
      where,
      limit,
      offset,
      order: [['planning_date', 'DESC'], ['id','DESC']],
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
exports.getCultivationById = async (req, res, next) => {
  try {
    const row = await Cultivation.findByPk(req.params.id, { include: includeUser });
    if (!row) return res.status(404).json({ error: 'Cultivation not found' });
    res.json(row);
  } catch (err) { next(err); }
};

// UPDATE
exports.updateCultivation = async (req, res, next) => {
  try {
    const row = await Cultivation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Cultivation not found' });

    const payload = { ...req.body };
    if (payload.planning_date) payload.planning_date = new Date(payload.planning_date);
    if (payload.expected_harvest_date) payload.expected_harvest_date = new Date(payload.expected_harvest_date);

    await row.update(payload);
    const withUser = await Cultivation.findByPk(row.id, { include: includeUser });
    res.json(withUser);
  } catch (err) { next(err); }
};

// DELETE
exports.deleteCultivation = async (req, res, next) => {
  try {
    const row = await Cultivation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Cultivation not found' });
    await row.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

// CONVENIENCE: by user
exports.getByUserId = async (req, res, next) => {
  req.query.user_id = req.params.user_id ?? req.query.user_id;
  return exports.getCultivations(req, res, next);
};
