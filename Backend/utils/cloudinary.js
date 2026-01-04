// const cloudinary = require("cloudinary");

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.SECRET_KEY,
// });

// const cloudinaryUploadImg = async (fileToUploads) => {
//   return new Promise((resolve) => {
//     cloudinary.uploader.upload(fileToUploads, (result) => {
//       resolve(
//         {
//           url: result.secure_url,
//           asset_id: result.asset_id,
//           public_id: result.public_id,
//         },
//         {
//           resource_type: "auto",
//         }
//       );
//     });
//   });
// };
// const cloudinaryDeleteImg = async (fileToDelete) => {
//   return new Promise((resolve) => {
//     cloudinary.uploader.destroy(fileToDelete, (result) => {
//       resolve(
//         {
//           url: result.secure_url,
//           asset_id: result.asset_id,
//           public_id: result.public_id,
//         },
//         {
//           resource_type: "auto",
//         }
//       );
//     });
//   });
// };

// module.exports = { cloudinaryUploadImg, cloudinaryDeleteImg };







const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.SECRET_KEY,
});

const cloudinaryUploadImg = async (filePath) => {
  return await cloudinary.uploader.upload(filePath, {
    resource_type: "auto", // ✅ THIS is what you wanted
  });
};

const cloudinaryDeleteImg = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: "auto",
  });
};

module.exports = {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
};
