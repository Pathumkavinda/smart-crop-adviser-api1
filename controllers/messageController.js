// controllers/messageController.js
const { Op } = require("sequelize");
const { Message, MessageFile, User } = require("../models");

// small helpers
const asInt = (v, d = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const paginate = (req) => {
  const page = Math.max(asInt(req.query.page || 1), 1);
  const limit = Math.min(Math.max(asInt(req.query.limit || 30), 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * POST /api/v1/messages
 * Body: { sender_id, receiver_id?, room?, text?, files?: [{path, original_name, mime_type, size_bytes}] }
 * - Either receiver_id (for DM) or room (for room chat) is required
 * - At least one of text or files is required
 */
exports.create = async (req, res) => {
  try {
    const { sender_id, receiver_id, room, text, files } = req.body || {};

    if (!sender_id) {
      return res.status(400).json({ success: false, message: "sender_id is required" });
    }
    if (!receiver_id && !room) {
      return res.status(400).json({ success: false, message: "Provide receiver_id (DM) or room (group)" });
    }
    if (!text && (!files || !Array.isArray(files) || files.length === 0)) {
      return res.status(400).json({ success: false, message: "Provide text or at least one file" });
    }

    // Optionally ensure users exist
    const sender = await User.findByPk(sender_id);
    if (!sender) return res.status(404).json({ success: false, message: "Sender not found" });

    if (receiver_id) {
      const receiver = await User.findByPk(receiver_id);
      if (!receiver) return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    const msg = await Message.create({
      sender_id,
      receiver_id: receiver_id || null,
      room: room || null,
      text: text || null,
    });

    // Attach files (if any)
    let savedFiles = [];
    if (Array.isArray(files) && files.length) {
      const rows = files.map((f) => ({
        message_id: msg.id,
        filepath: f.path,
        original_name: f.original_name,
        mime_type: f.mime_type,
        size_bytes: f.size_bytes,
      }));
      savedFiles = await MessageFile.bulkCreate(rows);
    }

    // Gather full payload
    const payload = {
      ...msg.toJSON(),
      files: savedFiles.map((r) => r.toJSON()),
    };

    // Emit over Socket.IO (server.js sets app.set('io', io))
    const io = req.app.get("io");
    if (io) {
      const targets = [];
      if (payload.room) targets.push(`room:${payload.room}`);
      if (payload.receiver_id) targets.push(`user:${payload.receiver_id}`);
      if (payload.sender_id) targets.push(`user:${payload.sender_id}`);

      targets.forEach((t) => io.to(t).emit("message:new", payload));
    }

    res.status(201).json({ success: true, data: payload });
  } catch (err) {
    console.error("message.create error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/messages/thread?userA=&userB=&page=&limit=
 * 1–1 thread between two users (no room)
 */
exports.getDmThread = async (req, res) => {
  try {
    const userA = asInt(req.query.userA);
    const userB = asInt(req.query.userB);
    if (!userA || !userB) {
      return res.status(400).json({ success: false, message: "userA and userB are required" });
    }
    const { page, limit, offset } = paginate(req);

    const where = {
      room: null,
      [Op.or]: [
        { sender_id: userA, receiver_id: userB },
        { sender_id: userB, receiver_id: userA },
      ],
    };

    const { rows, count } = await Message.findAndCountAll({
      where,
      include: [{ model: MessageFile, as: "files" }],
      order: [["created_at", "ASC"]],
      limit,
      offset,
    });

    res.json({ success: true, data: rows, meta: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (err) {
    console.error("message.getDmThread error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/messages/room/:room?page=&limit=
 */
exports.getRoomThread = async (req, res) => {
  try {
    const room = req.params.room;
    if (!room) return res.status(400).json({ success: false, message: "room is required" });

    const { page, limit, offset } = paginate(req);

    const { rows, count } = await Message.findAndCountAll({
      where: { room },
      include: [{ model: MessageFile, as: "files" }],
      order: [["created_at", "ASC"]],
      limit,
      offset,
    });

    res.json({ success: true, data: rows, meta: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (err) {
    console.error("message.getRoomThread error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/messages/user/:userId?page=&limit=
 * Inbox-style list (messages where user is sender or receiver)
 */
exports.listForUser = async (req, res) => {
  try {
    const userId = asInt(req.params.userId);
    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

    const { page, limit, offset } = paginate(req);

    const { rows, count } = await Message.findAndCountAll({
      where: {
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      include: [{ model: MessageFile, as: "files" }],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    res.json({ success: true, data: rows, meta: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (err) {
    console.error("message.listForUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markDelivered = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });
    await msg.update({ delivered_at: new Date() });
    res.json({ success: true, data: msg });
  } catch (err) {
    console.error("message.markDelivered error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });
    await msg.update({ read_at: new Date() });

    // broadcast read receipt if needed
    const io = req.app.get("io");
    if (io) {
      const targets = [];
      if (msg.room) targets.push(`room:${msg.room}`);
      if (msg.receiver_id) targets.push(`user:${msg.receiver_id}`);
      if (msg.sender_id) targets.push(`user:${msg.sender_id}`);
      targets.forEach((t) => io.to(t).emit("message:read", { id: msg.id, read_at: msg.read_at }));
    }

    res.json({ success: true, data: msg });
  } catch (err) {
    console.error("message.markRead error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
