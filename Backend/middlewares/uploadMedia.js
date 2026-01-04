//Backend/middlewares/uploadMedia.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const videoDir = path.join(__dirname, "../public/videos");

if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, videoDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (_, file, cb) => {
  if (file.mimetype.startsWith("video")) cb(null, true);
  else cb(null, false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});
