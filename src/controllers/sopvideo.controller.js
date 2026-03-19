const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { Ollama } = require("ollama");
const ollama = new Ollama();
const { parse } = require('yaml');
const fs = require('fs');
const db = require("../../db/models");
const { default: axios } = require("axios");
const { log } = require("console");
const sop = db.Sop;




const prepareScript = asyncHandler(async (req, res) => {

 
  
  const { fileUuids, query } = req.body;
 

  

  const businessId = req.organization.id;

  const file = fs.readFileSync("./prompts.yaml", "utf8");
  const promptConfig = parse(file).sop_scriptwriter;
  

  const searchQuery = query;

  const embeddedQuery = await ollama.embed({
    model: "nomic-embed-text",
    input: searchQuery,
  });

  const queryVector = embeddedQuery.embeddings;
  const index = req.app.locals.pineconeIndex;

  const queryResponse = await index.namespace(String(businessId)).query({
    vector: queryVector,
    topK: 20,
    filter: {
      file_uuid: {
        $in: fileUuids,
      },
    },
    includeMetadata: true,
  });

  
  

  const contextText = queryResponse.matches
    .filter((match) => match.score >= 0.5)
    .map((match) => match.metadata.chunk_text)
    .join("\n\n---\n\n");
  
  if (!contextText || contextText.length < 5) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "No relevant SOP documentation found for this topic.",
        ),
      );
  }


  
  

  const chatResponse = await ollama.chat({
    model: promptConfig.model,
    messages: [
      { role: "system", content: promptConfig.system_prompt },
      {
        role: "user",
        content: `Technical Documentation Context:\n${contextText}`,
      },
    ],
    
  });

  

  const finalScript = chatResponse?.message?.content;
  res.json(new ApiResponse(200, finalScript, "Final Script!"));
});





const generateSOPVideo = asyncHandler(async (req, res) => {

  const orgId = req.organization.id;

  
  const { scriptContent } = req.body;



  const newSop = {
    orgId,
    videoScript: scriptContent
  }

  const data = await sop.create(newSop);

  const response = await axios.post(
    "https://api.heygen.com/v2/video/generate", // Updated Endpoint
    {
      video_inputs: [
        // v2 uses video_inputs, not scenes
        {
          character: {
            type: "avatar",
            avatar_id: "3b700c2d48574599ac1b126d22eacea7",
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: scriptContent,
            voice_id: "f1e53f59a3314161b818ebcf9a2b5205",
          },
        },
      ],
      dimension: { width: 1280, height: 720 },
      callback_url: "https://dknjfbwx-5000.inc1.devtunnels.ms/webhooks/heygen", // Your public HTTPS endpoint
      callback_id: `${orgId}_sop_video`, // (Optional) A custom string to identify this job in your DB
    },
    {
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  const videoId = response.data.data.video_id;
  data.videoId = videoId
  await data.save();

  res.json(
    new ApiResponse(
      200,
      { success: true, videoId },
      "SOP video generation started!",
    ),
  );
});


module.exports = { generateSOPVideo, prepareScript };