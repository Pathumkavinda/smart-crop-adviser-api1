// routes/userFiles.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const controller = require('../controllers/userFileController');

const router = express.Router();

// -----------------------------
// Multer storage configuration
// -----------------------------
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const USER_FILES_DIR = path.join(UPLOADS_DIR, 'user_files');

if (!fs.existsSync(USER_FILES_DIR)) {
  fs.mkdirSync(USER_FILES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, USER_FILES_DIR);
  },
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const rand = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_').slice(0, 60);
    cb(null, `${ts}-${rand}-${base}${ext}`);
  },
});

// Optional: basic mime guard; relax if you accept anything
const fileFilter = (_req, _file, cb) => {
  // Accept all; tighten if needed (images, pdfs, etc.)
  cb(null, true);
};

const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || '52428800', 10); // 50MB
const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_UPLOAD_BYTES } });

// -----------------------------
// Routes
// -----------------------------

// Lists (with filters)
router.get('/', controller.getAll);

// Specific lists
router.get('/farmer/:farmer_id', controller.getAllByFarmer);
router.get('/adviser/:adviser_id', controller.getAllByAdviser);

// Single record
router.get('/:id', controller.getOne);

// Create (supports multipart with "file" or JSON-only)
router.post('/', upload.single('file'), controller.create);

// Update (optionally replace file)
router.put('/:id', upload.single('file'), controller.update);

// Delete
router.delete('/:id', controller.destroy);

module.exports = router;
