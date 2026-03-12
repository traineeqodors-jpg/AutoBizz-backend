app.post("/api/webhooks/heygen", async (req, res) => {
  const { event_type, data } = req.body;

  if (event_type === "avatar_video.success") {
    const { video_id, video_url } = data;

    // 1. Find the tenant associated with this video_id in your DB
    // 2. Trigger the background process to download and save to S3
    saveVideoToS3(video_id, video_url);
  }
  res.sendStatus(200);
});
