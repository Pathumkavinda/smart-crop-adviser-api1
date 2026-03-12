// routes/messages.js
const express = require("express");
const router = express.Router();
const msgCtrl = require("../controllers/messageController");

// Create (DM or room)
router.post("/", msgCtrl.create);

// Get a 1–1 thread (A <-> B)
router.get("/thread", msgCtrl.getDmThread); // ?userA=1&userB=2&page=1&limit=30

// Get messages in a room
router.get("/room/:room", msgCtrl.getRoomThread); // ?page=1&limit=30

// List all messages for one user (inbox style)
router.get("/user/:userId", msgCtrl.listForUser); // ?page=1&limit=30

// Mark delivered/read
router.patch("/:id/delivered", msgCtrl.markDelivered);
router.patch("/:id/read", msgCtrl.markRead);

module.exports = router;
