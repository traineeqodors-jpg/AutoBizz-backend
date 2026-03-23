const crypto = require("crypto");
const { asyncHandler } = require("../utils/asyncHandler");
const db = require("../../db/models");
const path = require("path");
const Sop = db.Sop;

const getVideoStatus = asyncHandler(async (req, res) => {

  // const contentStr = req.body.toString("utf-8");
  // console.log(contentStr);
  
  // // 1. EXTRACT THE SIGNATURE FROM HEADERS
  // console.log(req.head);
  
  // const signature = req.headers["signature"];
  
  // console.log(signature);
  

  //   // 2. GET THE RAW PAYLOAD
  //   // Note: Verification works best with the raw request body string
  // const payload = JSON.stringify(req.body);
  // console.log(payload);
  

  //   // 3. GENERATE YOUR OWN SIGNATURE USING THE SECRET
  // const secret = process.env.HEYGEN_WEBHOOK_SECRET;
  
  // console.log(secret);
  
  //   const computedSignature = crypto
  //     .createHmac("sha256", secret)
  //     .update(contentStr)
  //     .digest("hex");
  
  //   console.log(computedSignature);
    

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
    case "avatar_video.success": {
      const videoData = {
        videoId: event_data.video_id,
        videoUrl: event_data.url,
        status: "completed",
      };

      // 1. Update DB
      await Sop.update(
        { videoUrl: videoData.videoUrl },
        { where: { videoId: videoData.videoId } },
      );

      io.emit("video_updated", videoData);

      // 2. Setup Path & Ensure Directory Exists
      const dir = path.join(__dirname, "videos");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      const localPath = path.join(dir, `${videoData.videoId}.mp4`);

      // 3. Download using a Stream and handle it as a Promise
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
          // If this is a standard API call, respond here.
          // If it's a webhook, the response might have already been sent.
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