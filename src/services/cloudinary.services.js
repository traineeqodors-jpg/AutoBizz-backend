const { cloudinary } = require("../config/cloudinary");

const uploadVideo = async (url, videoId) => {
  try {
    return await cloudinary.uploader.upload(url, {
      resource_type: "video",
      folder: "autobizz-uploads",
      public_id: videoId,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload video to Cloudinary");
  }
};

module.exports = { uploadVideo };
