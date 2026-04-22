const { default: axios } = require("axios");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");

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
        throw new ApiError(400, error)
    }
  
};

module.exports = { generateHeygenAvatarVideo };
