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
const {
  generateHeygenAvatarVideo,
  checkVideoReady,
} = require("../services/sop.services");
const Sop = db.Sop;

const { OpenRouter } = require("@openrouter/sdk");
const { GoogleGenAI } = require("@google/genai");
const { createTTSAudio } = require("../services/elevenlabs.services");
const { sendAudioToSimli } = require("../services/sendAudioToSimli");

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API,
});

const genAI = new GoogleGenAI({});

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

  if (!query || !fileUuids?.length) {
    throw new ApiError(400, "Query or fileUuids missing");
  }

  const businessId = req.user.id;

  // Load prompt config
  const file = fs.readFileSync("./prompts.yaml", "utf8");
  const promptConfig = parse(file).sop_scriptwriter;

  const index = req.app.locals.pineconeIndex;

  // Embed query
  const embeddedQuery = await genAI.models.embedContent({
    model: process.env.EMBEDDING_MODEL,
    contents: query,
    config: {
      outputDimensionality: 1536,
    },
  });

  const queryVector = embeddedQuery.embeddings[0].values;

  // Query Pinecone with higher recall
  const queryResponse = await index.namespace(String(businessId)).query({
    vector: queryVector,
    topK: 25,
    filter: {
      file_uuid: {
        $in: fileUuids,
      },
    },
    includeMetadata: true,
  });

  // Instead of hard threshold (0.5), use top-N after sorting
  const matches = (queryResponse.matches || [])
    .filter((m) => m.metadata?.chunk_text) // safety
    .sort((a, b) => b.score - a.score) // highest first
    .slice(0, 10); // take best 10

  if (!matches.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No relevant SOP documentation found."));
  }

  // Extract chunks
  const contextChunks = matches.map((m) => m.metadata.chunk_text);

  // LIMIT CONTEXT SIZE
  const MAX_CONTEXT_CHARS = 12000;

  let contextText = "";
  for (const chunk of contextChunks) {
    if ((contextText + chunk).length > MAX_CONTEXT_CHARS) break;
    contextText += chunk + "\n\n---\n\n";
  }

  console.log(contextText);

  // include user query in prompt
  const userPrompt = `
  User Query:
  ${query}

  Technical Documentation Context:
  ${contextText}
  `;

  let chatResponse;

  try {
    chatResponse = await openrouter.chat.send({
      chatRequest: {
        model: process.env.SCRIPT_MODEL,
        messages: [
          {
            role: "system",
            content: promptConfig.system_prompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      },
    });
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw new ApiError(500, "OpenRouter request failed");
  }

  const finalScript = chatResponse?.choices?.[0]?.message?.content;

  if (!finalScript) {
    throw new ApiError(500, "Failed to generate script");
  }

  res.json(new ApiResponse(200, finalScript, "Final Script!"));
});

// const generateSOPVideo = asyncHandler(async (req, res) => {
//   const orgId = req.user.id;
//   if (!req.body || Object.keys(req.body).length === 0) {
//     throw new ApiError(400, "Request Body is Empty");
//   }

//   const { script, avatar_id, voice_id } = req.body;

//   const newSop = {
//     orgId,
//     videoScript: script,
//   };

//   const data = await Sop.create(newSop);

//   const videoGenerationFields = {
//     avatar_id,
//     script,
//     voice_id,
//     orgId,
//   };

//   const response = await generateHeygenAvatarVideo(videoGenerationFields);

//   const videoId = response?.video_id;
//   data.videoId = videoId;
//   await data.save();

//   res.json(
//     new ApiResponse(
//       200,
//       { success: true, videoId },
//       "SOP video generation started!",
//     ),
//   );
// });

const generateSOPVideo = asyncHandler(async (req, res) => {
  const orgId = req.user.id;
  const io = req.app.get("io");

  const { script, avatar_id } = req.body;

  const newSop = {
    orgId,
    videoScript: script,
    videoUrl: null,
  };

  const data = await Sop.create(newSop);

  const audioBuffer = await createTTSAudio(script);
  const simliResponse = await sendAudioToSimli(audioBuffer, avatar_id);

  const videoId = crypto.randomUUID();

  const videoUrl = simliResponse?.mp4_url;

  data.videoId = videoId;
  // data.videoUrl = videoUrl;
  await data.save();

  checkVideoReady(videoId, videoUrl, io);

  return res.json({
    success: true,
    videoId,
    message: "SOP video generation started! We'll notify you when it's ready.",
  });
});

const getAllVideos = asyncHandler(async (req, res) => {
  const businessId = req.user?.orgId || req?.user?.id;

  if (!businessId) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const videos = await Sop.findAll({
    where: {
      orgId: businessId,
    },
  });

  if (!videos) {
    throw new ApiError(400, "Cant Fetch Videos");
  }

  return res.json(new ApiResponse(200, videos || [], "All Sop Videos"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const businessId = req?.user?.id;

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
