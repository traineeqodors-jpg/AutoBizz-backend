const { asyncHandler } = require("../utils/asyncHandler");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const crypto = require("crypto");
const { Ollama } = require("ollama");
const ollama = new Ollama();
const officeParser = require("officeparser");
const { ApiError } = require("../utils/ApiError");

const upsertFileService = async ({ file, businessId, index }) => {
  try {
    // 1. Parsing Text from doc
    const ast = await officeParser.parseOffice(file.path);
    const cleanText = ast.toText();

    // 2. Define the Splitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 20,
    });

    // 3. Split the text you just got from pdfData
    const chunks = await splitter.splitText(cleanText);
    const uuid = crypto.randomUUID();

    //   Store uuid in DB

    // 4. Generate Embeddings with Ollama
    const records = await Promise.all(
      chunks.map(async (chunk, i) => {
        const response = await ollama.embed({
          model: "nomic-embed-text",
          input: chunk,
        });

        return {
          id: `${uuid}-${i}`,
          values: response.embeddings[0], // This is the vector [0.1, 0.2, ...]
          metadata: {
            chunk_text: chunk,
            filename: String(file.originalname),
            total_pages: Number(ast?.metadata?.pages || 0),
            file_uuid: uuid,
          },
        };
      }),
    );

    // 5. Upsert to Pinecone
    await index.namespace(String(businessId)).upsert({ records });

    console.log("File Upserted to Pinecone DB");
  } catch (error) {
    console.log(error);

    throw new ApiError(500, error.message);
  }
};

module.exports = { upsertFileService };
