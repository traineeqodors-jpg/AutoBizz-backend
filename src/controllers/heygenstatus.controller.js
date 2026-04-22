const crypto = require("crypto");
const { asyncHandler } = require("../utils/asyncHandler");
const db = require("../../db/models");
const path = require("path");
const Sop = db.Sop;

const getVideoStatus = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { event_type, event_data } = req.body;

  console.log(event_type);

  let videoData = null;

  const io = req.app.get("io");

  console.log(`Received event type: ${event_type}`);

  switch (event_type) {
    case "avatar_video.success": {
      const videoData = {
        videoId: event_data.video_id,
        videoUrl: event_data.url,
        status: "completed",
      };

      await Sop.update(
        { videoUrl: videoData.videoUrl },
        { where: { videoId: videoData.videoId } },
      );

      io.emit("video_updated", videoData);
      

      const dir = path.join(__dirname, "videos");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      const localPath = path.join(dir, `${videoData.videoId}.mp4`);

      try {
        const response = await axios({
          url: videoData.videoUrl,
          method: "GET",
          responseType: "stream",
        });

        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        writer.on("finish", () => {
          console.log(`Video ${videoData.videoId} saved to ${localPath}`);

          if (!res.headersSent)
            res.send({ message: "Success", path: localPath });
        });

        writer.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) res.status(500).send("File system error");
        });
      } catch (error) {
        console.error("Download failed:", error);
        if (!res.headersSent) res.status(500).send("Download failed");
      }
      break;
    }

    case "avatar_video.fail":
      const errorReason = event_data.message || "Unknown error";
      videoData = {
        videoId: event_data.video_id,
        videoUrl: "failed",
        status: "failed",
      };

      console.log(videoData);

      console.error(errorReason);

      await Sop.update(
        { videoUrl: "failed" },
        {
          where: { videoId: videoData.videoId },
          returning: true,
          plain: true,
        },
      );

      io.emit("video_updated", videoData);
      break;

    default:
      console.log(`Unhandled event type: ${event_type}`);
  }

  res.status(200).json({ message: "Webhook received", data: { videoData } });
});

module.exports = { getVideoStatus };
