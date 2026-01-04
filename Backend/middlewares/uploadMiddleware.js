const multer = require("multer");

const storage = multer.diskStorage({});

const uploadPhoto = multer({
  storage,
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith("image") ? cb(null, true) : cb(new Error("Not image")),
});

const uploadVideo = multer({
  storage,
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith("video") ? cb(null, true) : cb(new Error("Not video")),
});

module.exports = { uploadPhoto, uploadVideo };
