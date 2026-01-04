const asyncHandler = require("express-async-handler");

const uploadVideos = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No videos uploaded" });
  }

  const videos = req.files.map((file) => ({
    public_id: file.filename, // frontend expects this
    url: `/public/videos/${file.filename}`,
  }));

  res.status(200).json(videos); // 🔥 CRITICAL (no hanging)
});

module.exports = { uploadVideos };
