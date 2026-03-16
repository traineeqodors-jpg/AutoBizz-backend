
const {Ollama} = require("ollama")
const ollama = new Ollama()

const getRagResponse = async (query, pineconeIndex, orgId) => {
  
  const embeddedQuery = await ollama.embed({ model: "nomic-embed-text", input: query });
  
  
  const index = pineconeIndex;
  const queryResponse = await index.namespace(String(orgId)).query({
    vector: embeddedQuery.embeddings,
    topK: 5,
    includeMetadata: true,
  });

  const contexts = queryResponse.matches.map((m) => m.metadata.chunk_text).join("\n\n");

  
  const response = await ollama.chat({
    model: "tinyllama:1.1b",
    messages: [
      { role: "system", content: "Use the context to answer smartly. If not found, say I don't know." },
      { role: "user", content: `Context: ${contexts} \n\n Question: ${query}` },
    ],
  });

  return response?.message?.content; 
};


module.exports = {getRagResponse}