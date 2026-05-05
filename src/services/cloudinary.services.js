const { cloudinary } = require("../config/cloudinary");

const uploadVideo = async (url, videoId) => {
  return await cloudinary.uploader.upload(url, {
    resource_type: "video",
    folder: "autobizz-uploads",
    public_id: videoId,
  });
};

module.exports = { uploadVideo };
