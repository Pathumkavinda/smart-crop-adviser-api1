// controllers/userController.js
const { User, PredictionHistory } = require("../models");
const bcrypt = require("bcrypt");

const pickUpdatableFields = (src) => {
  const allowed = ["username", "email", "password", "landsize", "address", "userlevel"];
  const out = {};
  for (const k of allowed) if (k in src) out[k] = src[k];
  return out;
};

exports.createUser = async (req, res) => {
  try {
    const payload = pickUpdatableFields(req.body);

    // minimal validation (you can expand)
    if (!payload.username || !payload.email || !payload.password || !payload.userlevel) {
      return res.status(400).json({
        success: false,
        message: "username, email, password, and userlevel are required",
      });
    }

    // hash password
    payload.password = await bcrypt.hash(payload.password, 10);

    const user = await User.create(payload);
    // never return raw password
    const { password, ...safe } = user.toJSON();
    res.status(201).json({ success: true, data: safe });
  } catch (err) {
    // handle unique constraint errors clearly
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
        errors: err.errors?.map(e => ({ field: e.path, message: e.message })),
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // basic pagination ?page=1&limit=20
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      include: [{ model: PredictionHistory, as: "predictions" }],
      limit,
      offset,
      order: [["id", "ASC"]],
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      data: rows,
      meta: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: PredictionHistory, as: "predictions" }],
      attributes: { exclude: ["password"] },
    });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const updates = pickUpdatableFields(req.body);

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await user.update(updates);
    const { password, ...safe } = user.toJSON();
    res.json({ success: true, data: safe });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
        errors: err.errors?.map(e => ({ field: e.path, message: e.message })),
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    await user.destroy();
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ success: false, message: "email and password are required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const { password: pw, ...safe } = user.toJSON();
    res.json({ success: true, data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

