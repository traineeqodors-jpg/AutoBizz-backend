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
   const systemPrompt = `You are a natural human assistant. 
STRICT RULES:
1. Use ONLY the provided Context to answer. 
2. If the answer is not in the Context, ONLY say: "I'm sorry, I don't have that information."
3. Your response MUST be 2 lines or fewer. No exceptions.
4. Speak directly. Do NOT use prefixes like "Based on the context" or "Answer:".
5. Keep it conversational but extremely brief.`;


 const response = await ollama.chat({
    model: "tinyllama:1.1b",
    messages: [
      { role: "system", content: systemPrompt },
    
      { role: "user", content: `Context: ${contexts}\n\nQuestion: ${query}\n\nConstraint: Answer in 15 words or less.` },
    ],
    
    options: {
      num_predict: 40, 
      temperature: 0.3, 
    }
  });

  let cleanContent = response?.message?.content || "";
  cleanContent = cleanContent.replace(/^(Response|Answer|Assistant):\s*/i, "");
  return cleanContent;
};

module.exports = { getRagResponse };
