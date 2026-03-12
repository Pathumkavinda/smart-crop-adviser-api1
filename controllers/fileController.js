// controllers/fileController.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const mime = require("mime-types");

// ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "." + (mime.extension(file.mimetype) || "bin");
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

// Restrict file types & size (adjust to your needs)
const fileFilter = (_req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "application/pdf", "text/plain", "application/msword",
                   "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported file type"));
};
const limits = { fileSize: 10 * 1024 * 1024 }; // 10MB

const uploader = multer({ storage, fileFilter, limits });

exports.uploadSingle = [
  uploader.single("file"),
  (req, res) => {
    const publicPath = `/uploads/${req.file.filename}`; // server.js serves /uploads statically
    res.status(201).json({
      success: true,
      file: {
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size_bytes: req.file.size,
        path: publicPath,
      },
    });
  },
];

exports.uploadMulti = [
  uploader.array("files", 5),
  (req, res) => {
    const files = (req.files || []).map(f => ({
      original_name: f.originalname,
      mime_type: f.mimetype,
      size_bytes: f.size,
      path: `/uploads/${f.filename}`,
    }));
    res.status(201).json({ success: true, files });
  },
];
