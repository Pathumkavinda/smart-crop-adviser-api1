// controllers/userFileController.js
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { UserFile, User } = require('../models');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');               // served at /uploads
const USER_FILES_DIR = path.join(UPLOADS_DIR, 'user_files');           // served at /uploads/user_files

function baseUrl(req) {
  // Prefer env if you serve behind a proxy / domain
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function buildPublicUrl(req, storedName) {
  if (!storedName) return null;
  return `${baseUrl(req)}/uploads/user_files/${storedName}`;
}

function parseDateRange(date_from, date_to) {
  const where = {};
  if (date_from || date_to) {
    where[Op.and] = [];
    if (date_from) where[Op.and].push({ created_at: { [Op.gte]: new Date(date_from) } });
    if (date_to)   where[Op.and].push({ created_at: { [Op.lte]: new Date(date_to) } });
  }
  return where;
}

function pickUpdateFields(body) {
  const allowed = ['category', 'notes', 'public_url', 'original_name', 'mime_type', 'size_bytes'];
  const out = {};
  for (const k of allowed) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

/**
 * GET /api/v1/user-files
 * Query: page, limit, farmer_id, adviser_id, category, q (search in name/notes), date_from, date_to
 */
exports.getAll = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.farmer_id)  where.farmer_id = Number(req.query.farmer_id);
    if (req.query.adviser_id) where.adviser_id = Number(req.query.adviser_id);
    if (req.query.category)   where.category   = { [Op.eq]: String(req.query.category) };

    // Text search
    if (req.query.q) {
      const like = `%${String(req.query.q).trim()}%`;
      where[Op.or] = [
        { original_name: { [Op.like]: like } },
        { notes:         { [Op.like]: like } },
        { category:      { [Op.like]: like } },
      ];
    }

    // Date range
    Object.assign(where, parseDateRange(req.query.date_from, req.query.date_to));

    const { rows, count } = await UserFile.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: User, as: 'farmer',  attributes: ['id', 'username', 'email'] },
        { model: User, as: 'adviser', attributes: ['id', 'username', 'email'] },
      ],
    });

    res.json({
      page, limit, total: count, items: rows,
    });
  } catch (err) {
    console.error('user-files.getAll error:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
};

/**
 * GET /api/v1/user-files/:id
 */
exports.getOne = async (req, res) => {
  try {
    const file = await UserFile.findByPk(req.params.id, {
      include: [
        { model: User, as: 'farmer',  attributes: ['id', 'username', 'email'] },
        { model: User, as: 'adviser', attributes: ['id', 'username', 'email'] },
      ],
    });
    if (!file) return res.status(404).json({ error: 'Not found' });
    res.json(file);
  } catch (err) {
    console.error('user-files.getOne error:', err);
    res.status(500).json({ error: 'Failed to get file' });
  }
};

/**
 * GET /api/v1/user-files/farmer/:farmer_id
 * Query: page, limit, category, date_from, date_to, q
 */
exports.getAllByFarmer = async (req, res) => {
  try {
    const farmerId = Number(req.params.farmer_id ?? req.query.farmer_id);
    if (!farmerId) return res.status(400).json({ error: 'farmer_id is required' });

    const page  = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = { farmer_id: farmerId };
    if (req.query.category) where.category = { [Op.eq]: String(req.query.category) };
    Object.assign(where, parseDateRange(req.query.date_from, req.query.date_to));

    if (req.query.q) {
      const like = `%${String(req.query.q).trim()}%`;
      where[Op.or] = [
        { original_name: { [Op.like]: like } },
        { notes:         { [Op.like]: like } },
        { category:      { [Op.like]: like } },
      ];
    }

    const { rows, count } = await UserFile.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: User, as: 'farmer',  attributes: ['id', 'username', 'email'] },
        { model: User, as: 'adviser', attributes: ['id', 'username', 'email'] },
      ],
    });

    res.json({ page, limit, total: count, items: rows });
  } catch (err) {
    console.error('user-files.getAllByFarmer error:', err);
    res.status(500).json({ error: 'Failed to list files for farmer' });
  }
};

/**
 * GET /api/v1/user-files/adviser/:adviser_id
 * Query: page, limit, category, date_from, date_to, q
 */
exports.getAllByAdviser = async (req, res) => {
  try {
    const adviserId = Number(req.params.adviser_id ?? req.query.adviser_id);
    if (!adviserId) return res.status(400).json({ error: 'adviser_id is required' });

    const page  = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = { adviser_id: adviserId };
    if (req.query.category) where.category = { [Op.eq]: String(req.query.category) };
    Object.assign(where, parseDateRange(req.query.date_from, req.query.date_to));

    if (req.query.q) {
      const like = `%${String(req.query.q).trim()}%`;
      where[Op.or] = [
        { original_name: { [Op.like]: like } },
        { notes:         { [Op.like]: like } },
        { category:      { [Op.like]: like } },
      ];
    }

    const { rows, count } = await UserFile.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: User, as: 'farmer',  attributes: ['id', 'username', 'email'] },
        { model: User, as: 'adviser', attributes: ['id', 'username', 'email'] },
      ],
    });

    res.json({ page, limit, total: count, items: rows });
  } catch (err) {
    console.error('user-files.getAllByAdviser error:', err);
    res.status(500).json({ error: 'Failed to list files for adviser' });
  }
};

/**
 * POST /api/v1/user-files
 * Body: form-data (file) + fields: farmer_id, adviser_id, category?, notes?
 * Also supports JSON without a file (then you must provide original_name/mime_type/size_bytes/public_url)
 */
exports.create = async (req, res) => {
  try {
    const {
      farmer_id,
      adviser_id,
      category = null,
      notes = null,
      // allow manual metadata if no file uploaded
      original_name = null,
      mime_type = null,
      size_bytes = null,
      public_url = null,
    } = req.body;

    if (!farmer_id || !adviser_id) {
      return res.status(400).json({ error: 'farmer_id and adviser_id are required' });
    }

    let payload = {
      farmer_id: Number(farmer_id),
      adviser_id: Number(adviser_id),
      category,
      notes,
    };

    if (req.file) {
      // Uploaded file path already handled by multer.
      payload.original_name = req.file.originalname;
      payload.stored_name   = req.file.filename;
      payload.mime_type     = req.file.mimetype;
      payload.size_bytes    = req.file.size;
      payload.public_url    = buildPublicUrl(req, req.file.filename);
    } else {
      // No file uploaded. Ensure minimal metadata
      if (!original_name || !mime_type || !size_bytes) {
        return res.status(400).json({
          error: 'When no file is uploaded, you must provide original_name, mime_type, size_bytes',
        });
      }
      payload.original_name = String(original_name);
      payload.mime_type     = String(mime_type);
      payload.size_bytes    = Number(size_bytes);
      payload.stored_name   = null; // not stored on disk by this API
      payload.public_url    = public_url || null;
    }

    const created = await UserFile.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error('user-files.create error:', err);
    res.status(500).json({ error: 'Failed to create file record' });
  }
};

/**
 * PUT /api/v1/user-files/:id
 * Body: can replace file (multipart form-data field "file") and/or update fields (category, notes, etc.)
 */
exports.update = async (req, res) => {
  try {
    const rec = await UserFile.findByPk(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Not found' });

    let updates = pickUpdateFields(req.body);

    // If replacing file
    if (req.file) {
      // Remove old file if existed
      if (rec.stored_name) {
        try {
          fs.unlinkSync(path.join(USER_FILES_DIR, rec.stored_name));
        } catch (e) {
          // ignore if not present
        }
      }
      updates.original_name = req.file.originalname;
      updates.stored_name   = req.file.filename;
      updates.mime_type     = req.file.mimetype;
      updates.size_bytes    = req.file.size;
      updates.public_url    = buildPublicUrl(req, req.file.filename);
    }

    await rec.update(updates);
    res.json(rec);
  } catch (err) {
    console.error('user-files.update error:', err);
    res.status(500).json({ error: 'Failed to update file record' });
  }
};

/**
 * DELETE /api/v1/user-files/:id
 */
exports.destroy = async (req, res) => {
  try {
    const rec = await UserFile.findByPk(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Not found' });

    // Delete file from disk if we own it
    if (rec.stored_name) {
      try {
        fs.unlinkSync(path.join(USER_FILES_DIR, rec.stored_name));
      } catch (e) {
        // ignore if file missing
      }
    }

    await rec.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error('user-files.destroy error:', err);
    res.status(500).json({ error: 'Failed to delete file record' });
  }
};
