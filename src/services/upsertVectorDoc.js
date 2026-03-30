
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const { Ollama } = require("ollama");
const ollama = new Ollama();
const officeParser = require("officeparser");
const { ApiError } = require("../utils/ApiError");
 
const upsertFileService = async ({ file, businessId, index, uuid }) => {
  try {

    const ast = await officeParser.parseOffice(file.path);
    const cleanText = ast.toText();
 

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 20,
    });
 
    const chunks = await splitter.splitText(cleanText);

    const records = await Promise.all(
      chunks.map(async (chunk, i) => {
        const response = await ollama.embed({
          model: "nomic-embed-text",
          input: chunk,
        });
 
        return {
          id: `${uuid}-${i}`,
          values: response.embeddings[0], 
          metadata: {
            chunk_text: chunk,
            filename: String(file.originalname),
            total_pages: Number(ast?.metadata?.pages || 0),
            file_uuid: uuid,
          },
        };
      }),
    );
 
    
    await index.namespace(String(businessId)).upsert({ records });
 
    console.log("File Upserted to Pinecone DB");
  } catch (error) {
    console.log(error);
 
    throw new ApiError(500, error.message);
  }
};
 
module.exports = { upsertFileService };


 
 