// //Backend/routes/uploadRoute.js
// const express = require("express");
// const { uploadImages, deleteImages } = require("../controller/uploadCtrl");
// const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
// const { uploadPhoto, productImgResize } = require("../middlewares/uploadImage");
// const router = express.Router();

// router.post(
//   "/",
//   authMiddleware,
//   isAdmin,
//   uploadPhoto.array("images", 10),
//   // productImgResize,
//   uploadImages
// );

// router.delete("/delete-img/:id", authMiddleware, isAdmin, deleteImages);

// module.exports = router;




// const express = require("express");
// const { uploadImages, deleteImages } = require("../controller/uploadCtrl");
// const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
// // const { uploadPhoto } = require("../middlewares/uploadImage");
// const uploadAny = require("../middlewares/uploadAny");


// const router = express.Router();

// router.post(
//   "/",
//   authMiddleware,
//   isAdmin,
//   // uploadPhoto.array("images", 10),
//   // uploadAny.array("images", 10),
//   uploadAny.any(),


//   uploadImages
// );

// router.delete(
//   "/delete-img/:id",
//   authMiddleware,
//   isAdmin,
//   deleteImages
// );

// module.exports = router;











const express = require("express");
const router = express.Router();
const { uploadImages, uploadVideos, deleteImage, deleteVideo } = require("../controller/uploadCtrl");
const { uploadPhoto, uploadVideo } = require("../middlewares/uploadMiddleware");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

/* images */
router.post(
  "/",
  authMiddleware,
  isAdmin,
  uploadPhoto.array("images", 10),
  uploadImages
);

/* videos */
router.post(
  "/videos",
  authMiddleware,
  isAdmin,
  uploadVideo.array("videos", 5),
  uploadVideos
);

router.delete("/:id", authMiddleware, isAdmin, deleteImage);
router.delete("/video/:id", authMiddleware, isAdmin, deleteVideo);

module.exports = router;
