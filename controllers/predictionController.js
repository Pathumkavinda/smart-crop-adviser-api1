// controllers/predictionController.js
const { Op } = require("sequelize");
const { PredictionHistory, User } = require("../models");

// Helper: safely pick allowed fields from req.body
const pick = (obj, keys) => {
  if (!obj || typeof obj !== "object") return {};
  return keys.reduce((acc, k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});
};

const PICKABLE_FIELDS = [
  "user_id",
  "avg_humidity", "temp", "avg_rainfall", "land_area",
  "soil_type", "soil_ph_level", "nitrogen", "phosphate", "potassium",
  "district", "agro_ecological_zone", "cultivate_season", "crop_name"
];

// CREATE
exports.createPrediction = async (req, res) => {
  try {
    const payload = pick(req.body, PICKABLE_FIELDS);

    if (!payload.user_id) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    // ensure user exists
    const user = await User.findByPk(payload.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const pred = await PredictionHistory.create(payload);
    res.status(201).json({ success: true, data: pred });
  } catch (err) {
    console.error("createPrediction error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// LIST with filters & pagination
// GET /api/v1/predictions?user_id=1&crop_name=Potato&date_from=2025-08-01&date_to=2025-08-25&page=1&limit=20
exports.getAllPredictions = async (req, res) => {
  try {
    const where = {};

    if (req.query.user_id) where.user_id = req.query.user_id;
    if (req.query.crop_name) where.crop_name = req.query.crop_name;

    const { date_from, date_to } = req.query;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to);
    }

    const rows = await PredictionHistory.findAll({
      where,
      order: [["id", "ASC"]],
      include: [
        { model: User, as: "user", attributes: ["id", "username", "email"] },
      ],
    });

    res.json({
      success: true,
      data: rows,
      meta: { total: rows.length }, // optional metadata
    });
  } catch (err) {
    console.error("getAllPredictions error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ by id
exports.getPredictionById = async (req, res) => {
  try {
    const pred = await PredictionHistory.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
    });
    if (!pred) return res.status(404).json({ success: false, message: "Prediction not found" });
    res.json({ success: true, data: pred });
  } catch (err) {
    console.error("getPredictionById error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
exports.updatePrediction = async (req, res) => {
  try {
    const pred = await PredictionHistory.findByPk(req.params.id);
    if (!pred) return res.status(404).json({ success: false, message: "Prediction not found" });

    const updates = pick(req.body, PICKABLE_FIELDS);

    if (updates.user_id) {
      const user = await User.findByPk(updates.user_id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User (new user_id) not found" });
      }
    }

    await pred.update(updates);
    res.json({ success: true, data: pred });
  } catch (err) {
    console.error("updatePrediction error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deletePrediction = async (req, res) => {
  try {
    const pred = await PredictionHistory.findByPk(req.params.id);
    if (!pred) return res.status(404).json({ success: false, message: "Prediction not found" });
    await pred.destroy();
    res.json({ success: true, message: "Prediction deleted" });
  } catch (err) {
    console.error("deletePrediction error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// BY USER ID (with pagination)
exports.getPredictionsByUserId = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await PredictionHistory.findAndCountAll({
      where: { user_id: req.params.userId },
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      meta: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error("getPredictionsByUserId error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// LATEST for a user
exports.getLatestPredictionForUser = async (req, res) => {
  try {
    const pred = await PredictionHistory.findOne({
      where: { user_id: req.params.userId },
      order: [["created_at", "DESC"]],
    });
    if (!pred) return res.status(404).json({ success: false, message: "No predictions for this user" });
    res.json({ success: true, data: pred });
  } catch (err) {
    console.error("getLatestPredictionForUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// BY CROP NAME
exports.getPredictionsByCrop = async (req, res) => {
  try {
    const cropName = req.params.cropName;
    const list = await PredictionHistory.findAll({
      where: { crop_name: cropName },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error("getPredictionsByCrop error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// BY created_at WINDOW (inclusive)
// GET /api/v1/predictions/by-created/window?from=2025-08-01T00:00:00Z&to=2025-08-25T23:59:59Z
exports.getPredictionsByCreatedWindow = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    if (!from && !to) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one of: from, to (ISO date strings).",
      });
    }

    const where = {};
    if (from && to) where.created_at = { [Op.between]: [from, to] };
    else if (from) where.created_at = { [Op.gte]: from };
    else if (to) where.created_at = { [Op.lte]: to };

    const rows = await PredictionHistory.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getPredictionsByCreatedWindow error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
