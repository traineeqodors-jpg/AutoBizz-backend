// controllers/testChat.controller.js

const db = require("../../db/models");
const CallLog = db.CallLog;

const {
  getRagResponse,
  calculateLeadScore,
} = require("../services/rag.services");
const { generateAudio } = require("../services/elevenlabs.services");

const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { appendToTranscript } = require("../utils/transcript");

const testChat = asyncHandler(async (req, res) => {
  const { message, leadId } = req.body;
  const orgId = req.user?.orgId || req.user?.id;

  if (!message || !leadId) {
    throw new ApiError(400, "message and leadId required");
  }

  const pineconeIndex = req.app.locals.pineconeIndex;

  // -----------------------------
  // 1. SAVE USER MESSAGE
  // -----------------------------
  await appendToTranscript(leadId, orgId, "User", message);

  // -----------------------------
  // 2. GET AI RESPONSE (RAG + MEMORY)
  // -----------------------------
  const aiText = await getRagResponse(message, pineconeIndex, orgId, leadId);

  // -----------------------------
  // 3. SAVE AI RESPONSE
  // -----------------------------
  await appendToTranscript(leadId, orgId, "AI", aiText);

  // -----------------------------
  // 4. OPTIONAL AUDIO
  // -----------------------------
  const audioFile = await generateAudio(aiText);

  return res.json({
    success: true,
    data: {
      reply: aiText,
      audio: audioFile
        ? `${process.env.BASE_URL}/static/audio/${audioFile}`
        : null,
    },
  });
});

const testScore = asyncHandler(async (req, res) => {
  const { leadId } = req.body;
  const orgId = req.user?.orgId || req.user?.id;

  if (!leadId) {
    throw new ApiError(400, "leadId required");
  }

  // ----------------------------
  // 1. Fetch call logs
  // ----------------------------
  const logs = await CallLog.findAll({
    where: { leadId, orgId },
    order: [["createdAt", "ASC"]],
  });

  if (!logs.length) {
    return res.json({
      success: false,
      message: "No call logs found for this lead",
    });
  }

  // ----------------------------
  // 2. Build transcript
  // ----------------------------
  const transcript = logs
    .map((l) => {
      if (l.role === "AI") return `Agent: ${l.transcript}`;
      return `User: ${l.transcript}`;
    })
    .join("\n");

  // ----------------------------
  // 3. Run scoring
  // ----------------------------
  const result = await calculateLeadScore(transcript);

  console.log(result);

  let score = Number(result?.score || 0);
  if (isNaN(score)) score = 0;

  score = Math.round(score);

  // ----------------------------
  // 4. Derived status
  // ----------------------------
  let status = "cold";

  if (score >= 80) status = "hot";
  else if (score >= 60) status = "warm";
  else if (score >= 40) status = "contacted";

  // ----------------------------
  // 5. return result (NO DB update here)
  // ----------------------------
  return res.json({
    success: true,
    data: {
      score,
      status,
      transcript,
    },
  });
});

module.exports = { testChat, testScore };
