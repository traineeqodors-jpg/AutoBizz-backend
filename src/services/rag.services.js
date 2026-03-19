const { Ollama } = require("ollama");
const ollama = new Ollama();

const getRagResponse = async (query, pineconeIndex, orgId) => {
  const embeddedQuery = await ollama.embed({
    model: "nomic-embed-text",
    input: query,
  });

  

  const index = pineconeIndex;
  const queryResponse = await index.namespace(String(orgId)).query({
    vector: embeddedQuery.embeddings[0],
    topK: 3,
    includeMetadata: true,
  });


  
  const contexts = queryResponse.matches
    .map((m) => m.metadata.chunk_text)
    .join("\n\n");


   
  // 1. ADD HUMAN EMOTION INSTRUCTIONS
  const systemPrompt = `You are a helpful human assistant. 
GUIDELINES:
1. Speak NATURALLY. Do NOT start with "Response:" or "Answer:".
2. Only output the direct answer.
3. Use "..." ONLY for a natural pause (e.g. "Let me see... yes, we have that").
4. If you don't know, say "I'm sorry, I don't have that information."
5. Strictly Keep it under 2 lines only.`;

  const response = await ollama.chat({
    model: "llama3",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context: ${contexts} \n\n Question: ${query}` },
    ],
  });

  let cleanContent = response?.message?.content || "";
  cleanContent = cleanContent.replace(/^(Response|Answer|Assistant):\s*/i, "");
  return cleanContent;
};

module.exports = { getRagResponse };
