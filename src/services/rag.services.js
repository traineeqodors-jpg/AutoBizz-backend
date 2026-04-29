const db = require("../../db/models");
const CallLog = db.CallLog;

const { Ollama } = require("ollama");
const ollama = new Ollama();

const { OpenRouter } = require("@openrouter/sdk");
const { GoogleGenAI } = require("@google/genai");

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API,
});

const genAI = new GoogleGenAI({});

// const systemPrompt = `
// You are a business AI assistant for a SaaS automation platform.

// Your job is to answer user questions using the provided context.

// ========================
// CORE RULES
// ========================

// 1. Use ONLY the provided context when it is relevant.
// 2. If context is not relevant, answer normally using general knowledge.
// 3. Never hallucinate facts.
// 4. Never mention "context", "documents", or internal system details.

// ========================
// OUTPUT STYLE RULES
// ========================

// - Respond in plain text only.
// - Do NOT use markdown formatting (no **bold**, no bullet points, no numbering, no headers).
// - Do NOT use asterisks, hashtags, or special symbols.
// - Write in short, natural sentences.
// - If multiple points exist, separate them using line breaks only.
// - Keep responses human and conversational.

// ========================
// BEHAVIOR RULES
// ========================

// - If the answer is clear → respond in 1–3 short sentences.
// - If clarification is needed → ask ONE simple follow-up question.
// - Never over-explain.
// - Never return structured lists or steps.

// ========================
// GOAL
// ========================

// Be like a smart assistant speaking naturally, not a document generator.
// `;

const getRagResponse = async (query, pineconeIndex, orgId, leadId) => {
  try {
    // Embedding
    const embeddedQuery = await genAI.models.embedContent({
      model: "gemini-embedding-2",
      contents: query,
      config: {
        outputDimensionality: 1536,
      },
    });

    const queryVector = embeddedQuery.embeddings[0].values;

    // PINECONE SEARCH
    const queryResponse = await pineconeIndex.namespace(String(orgId)).query({
      vector: queryVector,
      topK: 7,
      includeMetadata: true,
    });

    const filteredMatches = queryResponse.matches || [];

    let contexts = filteredMatches
      .map((m) => m.metadata?.chunk_text || "")
      .join("\n\n");

    // SAFE FALLBACK CONTEXT
    if (!contexts.trim()) {
      contexts =
        "No relevant internal documentation found. Answer using general knowledge in a simple way.";
    }

    // CLEAN CONTEXT
    contexts = contexts
      .replace(/\*\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/[*>`]/g, "")
      .replace(/\n\d+\./g, "\n");

    // fetch latest conversation
    const callLog = await CallLog.findOne({
      where: { leadId, orgId },
      order: [["updatedAt", "DESC"]],
    });

    let memory = "";

    if (callLog?.transcript) {
      memory = callLog.transcript
        .split("\n")
        .slice(-12) // last 10 messages (IMPORTANT)
        .join("\n");
    }

    if (!memory.trim()) {
      memory = "No prior conversation.";
    }

    const systemPrompt = `
    You are a business AI assistant for a SaaS automation platform.

    Your job is to answer user questions clearly and continue the conversation naturally.

    ========================
    CORE RULES
    ========================
    - Use provided context if relevant
    - If not relevant, answer using general knowledge
    - Never hallucinate
    - Never mention context or internal system

    ========================
    OUTPUT FORMAT (STRICT)
    ========================
    - Always respond in TWO parts:
      1. Answer (1–2 short sentences)
      2. Follow-up question (1 sentence)

    - The follow-up question MUST always be present
    - Put the question on a new line
    - Do NOT skip the question

    ========================
    STYLE RULES
    ========================
    - Plain text only
    - No markdown
    - No bullet points
    - No numbering
    - No special symbols (*, #, etc.)
    - Keep tone natural and conversational

    ========================
    FOLLOW-UP LOGIC
    ========================
    - If topic is a process → ask about steps, challenges, or improvements
    - If topic is product/service → ask about interest, pricing, demo, or use-case
    - If unsure → ask a clarifying question

    ========================
    CONVERSATION BEHAVIOR
    ========================
    - Do not repeat previous answers
    - Build on the conversation naturally
    - Keep responses short and engaging

    ========================
    MEMORY RULES
    ========================
    - Use conversation history to maintain flow
    - Do not repeat previous answers
    - Answer based on what has already been discussed
    - If a question was already asked, do not ask it again

    ========================
    GOAL
    ========================
    Sound like a helpful human assistant, not a document or chatbot.
    `;

    console.log("Chat memory : ", memory);

    // OPENROUTER CALL
    const chatResponse = await openrouter.chat.send({
      chatRequest: {
        model: process.env.CALL_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          // {
          //   role: "user",
          //   content: `Context:\n${contexts}\n\nQuestion:\n${query}`,
          // },
          {
            role: "user",
            content: `
            User Question:
            ${query}

            Conversation History:
            ${memory}

            Context:
            ${contexts}
            `,
          },
        ],
      },
    });

    // CLEAN OUTPUT
    let cleanContent = chatResponse?.choices?.[0]?.message?.content || "";

    cleanContent = cleanContent
      .replace(/^(Response|Answer|Assistant):\s*/i, "")
      .replace(/\*\*/g, "")
      .trim();

    return cleanContent;
  } catch (error) {
    console.error("RAG Error:", error);
    throw new ApiError(500, "RAG system failed");
  }
};

const calculateLeadScore = async (transcript) => {
  const systemPrompt = `
You are an expert B2B lead scoring engine.

You must evaluate conversation quality and return ONLY a number from 0 to 100.

STRICT RULES:
- Output ONLY integer number
- No words, no explanation, no symbols
- If unsure, still guess based on intent signals

SCORING MODEL:
- 0–20: cold lead, no intent
- 21–40: weak interest
- 41–60: moderate intent
- 61–80: strong intent
- 81–100: high buying intent

Signals:
- Pricing, demo, meeting = HIGH SCORE
- Questions about process = MEDIUM
- Casual chat = LOW

Return only number.
`;

  try {
    const response = await openrouter.chat.send({
      chatRequest: {
        model: process.env.CALL_MODEL,
        temperature: 0, // 🔥 IMPORTANT (makes output stable)
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `CONVERSATION:\n${transcript}`,
          },
        ],
      },
    });

    let text = response?.choices?.[0]?.message?.content || "";

    console.log("RAW SCORE RESPONSE:", text);

    // 🔥 HARD CLEANING (VERY IMPORTANT)
    text = text.replace(/[^0-9]/g, ""); // keep only numbers

    let score = parseInt(text, 10);

    if (isNaN(score)) score = 0;
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return { score };
  } catch (error) {
    console.error("Scoring Error:", error.message);
    return { score: 0 };
  }
};

module.exports = { getRagResponse, calculateLeadScore };
