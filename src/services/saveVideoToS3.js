const AWS = require("aws-sdk");
const s3 = new AWS.S3();


// app.post("/api/prepare-script",
    
    
const prepareScript = asyncHandler(async (req, res) => {
  const { tenantId, topic } = req.body;

  // 1. Retrieve relevant data from your Vector DB
  const contextChunks = await vectorDb.search({
    query: topic,
    filter: { tenant_id: tenantId }, // CRITICAL for multi-tenancy
    limit: 3,
  });

  const contextText = contextChunks.map((c) => c.text).join("\n");

  // 2. Generate script using an LLM
  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context: ${contextText}\n\nTopic: ${topic}` },
    ],
  });

  const finalScript = chatResponse.choices[0].message.content;

  // 3. Return to frontend or pass directly to HeyGen module
  res.json({ script: finalScript });
});




async function saveVideoToS3(videoId, videoUrl) {
  const response = await axios({
    url: videoUrl,
    method: "GET",
    responseType: "stream",
  });

  // Retrieve tenantId from your database using videoId
  const tenantId = await getTenantByVideo(videoId);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `tenants/${tenantId}/sop-videos/${videoId}.mp4`, // Multi-tenant pathing
    Body: response.data,
    ContentType: "video/mp4",
  };

  await s3.upload(params).promise();
  // Update DB status to 'completed' and save the new S3 URL
}


module.exports = {saveVideoToS3, prepareScript}
