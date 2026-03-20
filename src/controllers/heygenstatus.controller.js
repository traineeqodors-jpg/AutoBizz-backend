const crypto = require("crypto");
const { asyncHandler } = require("../utils/asyncHandler");
const db = require("../../db/models");
const Sop = db.Sop;

const getVideoStatus = asyncHandler(async (req, res) => {
  // 1. EXTRACT THE SIGNATURE FROM HEADERS
  //   const signature = req.headers["signature"];

  //   // 2. GET THE RAW PAYLOAD
  //   // Note: Verification works best with the raw request body string
  //   const payload = JSON.stringify(req.body);

  //   // 3. GENERATE YOUR OWN SIGNATURE USING THE SECRET
  //   const secret = process.env.HEYGEN_WEBHOOK_SECRET;
  //   const computedSignature = crypto
  //     .createHmac("sha256", secret)
  //     .update(payload)
  //     .digest("hex");

  //   // 4. COMPARE AND REJECT IF THEY DON'T MATCH
  //   if (computedSignature !== signature) {
  //     console.error("Invalid Signature! Request might not be from HeyGen.");
  //     return res.status(401).json({ message: "Unauthorized" });
  //   }

  const { event_type, event_data } = req.body; // HeyGen uses event_data

  console.log(event_type);

  let videoData = null;

  const io = req.app.get("io");

  console.log(`Received event type: ${event_type}`);

  switch (event_type) {
    case "avatar_video.success":
      // The direct URL to the MP4 file
      videoData = {
        videoId: event_data.video_id,
        videoUrl: event_data.url,
        status: "completed",
      };

      console.log(videoData);

      // Update your DB: find the SOP by videoId or event_data.callback_id
      await Sop.update(
        { videoUrl: videoData.videoUrl },
        { where: { videoId: videoData.videoId }, returning: true, plain: true },
      );

      io.emit("video_updated", videoData);
      break;

    case "avatar_video.fail":
      // HeyGen usually sends the reason in 'message' or 'error'
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

  // CRITICAL: Always return 200 so HeyGen doesn't retry for 24 hours
  res.status(200).json({ message: "Webhook received", data: { videoData } });
});

module.exports = { getVideoStatus };