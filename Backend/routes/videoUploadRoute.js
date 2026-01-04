const express = require("express");
const { uploadVideos } = require("../controller/videoUploadCtrl");
const uploadVideo = require("../middlewares/uploadVideo");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/videos",
  authMiddleware,
  isAdmin,
  uploadVideo.array("videos", 5),
  uploadVideos
);

module.exports = router;
