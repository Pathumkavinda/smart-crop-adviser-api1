// routes/files.js
const express = require("express");
const router = express.Router();
const fileCtrl = require("../controllers/fileController");

// single file upload under form field name 'file'
router.post("/upload", fileCtrl.uploadSingle);

// (Optional) multi-file
router.post("/multi", fileCtrl.uploadMulti);

module.exports = router;
