const { default: axios } = require("axios");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { uploadVideo } = require("./cloudinary.services");
const db = require("../../db/models");
const Sop = db.Sop;

const generateHeygenAvatarVideo = async (videoGenerationInputs) => {
  try {
    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: videoGenerationInputs.avatar_id,
              avatar_style: "normal",
            },
            voice: {
              type: "text",
              input_text: videoGenerationInputs.script,
              voice_id: videoGenerationInputs.voice_id,
            },
          },
        ],
        dimension: { width: 1280, height: 720 },
      },
      {
        headers: {
          "X-Api-Key": process.env.HEYGEN_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Response in service,", response?.data?.data);

    const data = response?.data?.data;

    return data;
  } catch (error) {
    throw new ApiError(400, error);
  }
};

const checkVideoReady = async (videoId, videoUrl, io) => {
  let isVideoReady = false;
  let maxRetries = 20;

  while (!isVideoReady && maxRetries > 0) {
    try {
      const res = await axios.get(videoUrl, {
        responseType: "stream",
        validateStatus: () => true,
      });

      if (res.status === 200) {
        isVideoReady = true;
        console.log("Video ready → uploading to Cloudinary");

        const cloudRes = await uploadVideo(videoUrl, videoId);

        const finalUrl = cloudRes.secure_url;
        const finalPublicId = cloudRes.public_id;

        console.log(
          "Cloudinary upload successful, URL:",
          finalUrl,
          "Public ID:",
          finalPublicId,
        );

        await Sop.update(
          { videoUrl: finalUrl, videoId: finalPublicId },
          { where: { videoId } },
        );

        io.emit("video_updated", {
          videoId,
          videoUrl: finalUrl,
        });

        return;
      }
    } catch (err) {
      console.log(`⏳ retry left ${maxRetries - 1} - video not ready yet...`);
      maxRetries--;
    }

    await new Promise((r) => setTimeout(r, 30000));
  }

  // failed
  await Sop.update(
    { videoUrl: "failed", videoId: cloudRes.public_id },
    { where: { videoId } },
  );

  io.emit("video_updated", {
    videoId,
    videoUrl: "failed",
  });
};

module.exports = { generateHeygenAvatarVideo, checkVideoReady };
