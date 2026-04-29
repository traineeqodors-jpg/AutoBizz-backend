const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const { Ollama } = require("ollama");
const ollama = new Ollama();
const officeParser = require("officeparser");
const { ApiError } = require("../utils/ApiError");
const { GoogleGenAI } = require("@google/genai");

const genAI = new GoogleGenAI({});

const upsertFileService = async ({ file, businessId, index, uuid }) => {
  try {
    const ast = await officeParser.parseOffice(file.path);
    const cleanText = ast
      .toText()
      .replace(/\s+/g, " ") // collapse multiple spaces/newlines
      .trim();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: ["\n\n", "\n", ".", " ", ""],
    });

    const chunks = await splitter.splitText(cleanText);

    if (!chunks.length) {
      throw new Error("No text chunks generated from document");
    }

    // const response = await ollama.embed({
    //   model: "nomic-embed-text",
    //   input: chunks,
    // });

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const res = await genAI.models.embedContent({
          model: "gemini-embedding-2",
          contents: chunk,
          config: {
            outputDimensionality: 1536,
          },
        });

        return res.embeddings[0].values;
      }),
    );

    // safety check
    if (!embeddings || embeddings.length !== chunks.length) {
      throw new Error("Embedding mismatch: chunks vs embeddings count");
    }

    const records = chunks.map((chunk, i) => ({
      id: `${uuid}-${i}`,
      values: embeddings[i],
      metadata: {
        chunk_text: chunk,
        filename: String(file.originalname),
        file_uuid: uuid,
        chunk_index: i,
        total_chunks: chunks.length,
        total_pages: Number(ast?.metadata?.pages || 0),
      },
    }));

    const batchSize = 100;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      await index.namespace(String(businessId)).upsert({ records: batch });
    }
    console.log("File Upserted to Pinecone DB");
  } catch (error) {
    console.log(error);

    throw new ApiError(500, error.message || "File processing failed");
  }
};

module.exports = { upsertFileService };
