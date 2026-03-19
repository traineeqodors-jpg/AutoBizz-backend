const crypto = require("crypto");
const { asyncHandler } = require("../utils/asyncHandler");

const getVideoStatus = asyncHandler((req, res) => {
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

  console.log(`Received event type: ${event_type}`);

  switch (event_type) {
    case "avatar_video.success":
      // The direct URL to the MP4 file
      const videoUrl = event_data.url;
      const videoId = event_data.video_id;

      console.log(`Video ${videoId} ready! URL: ${videoUrl}`);

      // Update your DB: find the SOP by videoId or event_data.callback_id
      // await sop.findOneAndUpdate({ videoId }, { status: 'completed', videoUrl });
      break;

    case "avatar_video.fail":
      // HeyGen usually sends the reason in 'message' or 'error'
      const errorReason = event_data.message || "Unknown error";
      console.error(`Video ${event_data.video_id} failed: ${errorReason}`);

      // Update DB to 'failed' status
      break;

    default:
      console.log(`Unhandled event type: ${event_type}`);
  }

  // CRITICAL: Always return 200 so HeyGen doesn't retry for 24 hours
  res
    .status(200)
    .json({ message: "Webhook received", data: { videoUrl, videoId } });
});

module.exports = { getVideoStatus };