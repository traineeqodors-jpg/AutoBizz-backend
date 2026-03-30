app.post("/api/webhooks/heygen", async (req, res) => {
  const { event_type, data } = req.body;

  if (event_type === "avatar_video.success") {
    const { video_id, video_url } = data;

    
    saveVideoToS3(video_id, video_url);
  }
  res.sendStatus(200);
});