const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { Ollama } = require("ollama");
const ollama = new Ollama();
const { parse } = require("yaml");
const fs = require("fs");
const db = require("../../db/models");
const { default: axios } = require("axios");
const path = require("path");
const { ApiError } = require("../utils/ApiError");
const Sop = db.Sop;

const testDownload = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { videoUrl } = req.body;

  const dir = path.join(process.cwd(), "public", "videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const localPath = path.join(dir, `TEST.mp4`);

  const response = await axios({
    url: videoUrl,
    method: "GET",
    responseType: "stream",
  });

  const writer = fs.createWriteStream(localPath);
  response.data.pipe(writer);

  writer.on("finish", () => {
    console.log(`Video test saved to ${localPath}`);
    if (!res.headersSent) res.send({ message: "Success", path: localPath });
  });

  writer.on("error", (err) => {
    console.error("Stream error:", err);
    if (!res.headersSent) res.status(500).send("File system error");
  });

  res.status(200).json(new ApiResponse(200, writer, "VIDEO DOWNLOADED"));
});

const prepareScript = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

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

  const contextChunks = queryResponse.matches
    .filter((match) => match.score >= 0.5)
    .map((match) => match.metadata.chunk_text);

  console.log(contextChunks);

  if (!contextChunks || contextChunks.length < 3) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No relevant SOP documentation found."));
  }

  const contextText = contextChunks.join("\n\n---\n\n");

  let chatResponse;
  try {
    chatResponse = await ollama.chat({
      model: promptConfig.model,
      messages: [
        { role: "system", content: promptConfig.system_prompt },
        {
          role: "user",
          content: `Technical Documentation Context:\n${contextText}`,
        },
      ],
    });
    
  } catch (error) {
    console.log(error)
  }

  const finalScript = chatResponse?.message?.content;
  res.json(new ApiResponse(200, finalScript, "Final Script!"));
});

const generateSOPVideo = asyncHandler(async (req, res) => {
  const orgId = req.organization.id;
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { scriptContent } = req.body;

  const newSop = {
    orgId,
    videoScript: scriptContent,
  };

  const data = await Sop.create(newSop);

  const response = await axios.post(
    "https://api.heygen.com/v2/video/generate", 
    {
      video_inputs: [
     
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
      callback_url: process.env.BASE_URL, 
      callback_id: `${orgId}_sop_video`, 
    },
    {
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  const videoId = response.data.data.video_id;
  data.videoId = videoId;
  await data.save();

  res.json(
    new ApiResponse(
      200,
      { success: true, videoId },
      "SOP video generation started!",
    ),
  );
});

const getAllVideos = asyncHandler(async (req, res) => {
  const businessId = req?.organization?.id;

  if (!businessId) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const videos = await Sop.findAll({
    where: {
      orgId: businessId,
    },
  });

  if(!videos){
    throw new ApiError(400 , "Cant Fetch Videos")
  }

  return res.json(new ApiResponse(200, videos || [], "All Sop Videos"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const businessId = req?.organization?.id;

  if (!businessId) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  
  const video = await Sop.findOne({
    where: {
      id: videoId,
      orgId: businessId,
    },
  });

 
  if (!video) {
    throw new ApiError(
      404,
      "Video not found or you do not have permission to delete it",
    );
  }


  await video.destroy();

  return res.json(new ApiResponse(200, {}, "Sop Video deleted successfully"));
});

module.exports = {
  generateSOPVideo,
  prepareScript,
  getAllVideos,
  deleteVideo,
  testDownload,
};
