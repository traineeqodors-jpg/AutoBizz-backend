const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { Ollama } = require("ollama");
const ollama = new Ollama();

// const prepareScript = asyncHandler(async (req, res) => {
//   const systemPrompt = `You are a professional SOP Video Scriptwriter. Your goal is to convert technical documentation into an engaging script for an AI Avatar. 
//     TONE: Professional, clear, and instructional.
//     STRUCTURE: 
//         1. Hook (10 seconds)
//         2. Step-by-step instructions
//         3. Summary/Conclusion

//     CONSTRAINTS:
//         - Use ONLY the provided context. 
//         - Keep the total script under 1000 words.
//         - Write in a conversational "spoken" style.`;

//   // 1. Retrieve relevant data from your Vector DB

//   const embeddedQuery = await ollama.embed({
//     model: "nomic-embed-text",
//     input: systemPrompt,
//   });

//   const queryVector = embeddedQuery.embeddings;

//   const index = req.app.locals.pineconeIndex;

//   const queryResponse = await index.namespace(String(9)).query({
//     vector: queryVector,
//     topK: 5,
//     includeMetadata: true,
//   });

//   // Extract the actual text from your metadata fields
//   const contextText = queryResponse.matches
//     .map((match) => match.metadata.chunk_text) // Ensure 'chunk_text' matches your DB key
//     .join("\n\n");

//   // 2. Generate script using an LLM

//   const chatResponse = await ollama.chat({
//     model: "tinyllama:1.1b",
//     messages: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: `Context: ${contextText}` },
//     ],
//   });

//   // const chatResponse = await openai.chat.completions.create({
//   //     model: "gpt-4o",
//   //     messages: [
//   //         { role: "system", content: systemPrompt },
//   //         { role: "user", content: `Context: ${contextText}\n\nTopic: ${topic}` }
//   //     ]
//   // });

//   const finalScript = chatResponse?.message?.content;

//   res.json(new ApiResponse(200, finalScript, "Final Script!"));
// });

const prepareScript = asyncHandler(async (req, res) => {
  // NEW: Instead of embedding the system prompt, embed a "generic search"
  // or a summary of the uploaded document to find actual SOP steps.
  const searchQuery = "Standard Operating Procedure instructions and steps";

  const embeddedQuery = await ollama.embed({
    model: "nomic-embed-text",
    input: searchQuery,
  });

  const queryVector = embeddedQuery.embeddings;
  const index = req.app.locals.pineconeIndex;

  const queryResponse = await index.namespace(String(9)).query({
    vector: queryVector,
    topK: 8, // Increased to get more context for the script
    // filter: {
    //   file_uuid: { $eq: "2db2730e-9816-4678-9aa1-344905030d64" },
    // },
    includeMetadata: true,
  });

  const contextText = queryResponse.matches
    .map((match) => match.metadata.chunk_text)
    .join("\n\n");

  // REFINED PROMPT: Explicitly instructs the LLM to find the topic itself
  const systemPrompt = `You are a professional SOP Video Scriptwriter for HeyGen AI Avatars.
    TASK: Identify the main procedure in the provided context and write a conversational script.
    STRUCTURE: 
        1. Hook (10s): "In this video, we'll cover [Topic]..."
        2. Steps: Clear, numbered "spoken" instructions.
        3. Closing: Summary and next steps.
    TONE: Helpful, professional, and clear.
    CONSTRAINTS: Use ONLY provided context. Keep under 500 words for better video pacing.`;

  const chatResponse = await ollama.chat({
    model: "tinyllama:1.1b", // CHANGE: TinyLlama is too weak for this logic. Use Llama3 or Mistral.
    messages: [
      { role: "system", content: systemPrompt },
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
  const { scriptContent } = req.body;

  const response = await axios.post(
    "https://api.heygen.com/v2/video/generate",
    {
      title: `SOP for Tenant `,
      video_setting: {
        ratio: "16:9", // or "9:16" for vertical
        dimension: { width: 1280, height: 720 },
      },
      dimension: { width: 1280, height: 720 },
      scenes: [
        {
          avatar_id: "b3f809c1eea64f7fb15b848897f8f7b5",
          avatar_style: "normal",
          voice: {
            type: "text",
            input_text: scriptContent,
            voice_id: "cc5fb6c924064712ba9f690852aa4646",
          },
        },
      ],
    },
    {
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  const videoId = response.data.data.video_id;

  res.json(
    new ApiResponse(
      200,
      { success: true, videoId },
      "SOP video generation started!",
    ),
  );
});


module.exports = { generateSOPVideo, prepareScript };
