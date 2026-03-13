const { Pinecone } = require("@pinecone-database/pinecone");

const pc = new Pinecone({
  apiKey: process.env.PINECONE_KEY,
});

async function initPinecone(businessName) {
  //   const indexName = `biz-${businessId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`; // Pinecone names must be lowercase

  const indexName = "business-vault";

  try {
    const { indexes } = await pc.listIndexes();
    const exists = indexes.some((idx) => idx.name === indexName);

    if (!exists) {
      console.log(`Creating Inference Index for business: ${indexName}`);

      // await pc.createIndexForModel({
      //   name: indexName,
      //   cloud: "aws",
      //   region: "us-east-1",
      //   embed: {
      //     model: "llama-text-embed-v2",
      //     fieldMap: { text: "chunk_text" },
      //   },
      //   waitUntilReady: true,
      // });
      await pc.createIndex({
        name: "business-vault",
        dimension: 768,
        metric: "cosine",
        spec: {
          serverless: { cloud: "aws", region: "us-east-1" },
        },
        waitUntilReady: true,
      });
    }
    return pc.index(indexName);
  } catch (error) {
    console.error(`Error accessing index for ${businessId}:`, error);
    throw error;
  }
}

module.exports = { pc, initPinecone };
