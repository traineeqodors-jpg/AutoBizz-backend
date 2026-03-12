const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX_NAME);

/**
 * Converts a user question into a vector and searches Pinecone
 */
const queryRAG = async (userQuery) => {
    try {
        // 1. Generate embedding for the user's question
        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: userQuery,
        });

        // 2. Query Pinecone for the top 3 most relevant matches
        const queryResponse = await index.namespace("business-manual").query({
            vector: embedding.data[0].embedding,
            topK: 3,
            includeMetadata: true,
        });

        // 3. Extract the text content from the metadata
        const context = queryResponse.matches
            .map((match) => match.metadata.text)
            .join("\n\n");

        console.log("🔍 RAG Context Retrieved from Pinecone");
        return context || "No relevant information found in the manual.";
    } catch (error) {
        console.error("❌ Pinecone Query Error:", error.message);
        return "Error accessing business manual.";
    }
};

module.exports = { queryRAG };
