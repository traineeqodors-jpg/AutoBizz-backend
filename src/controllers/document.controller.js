"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const path = require("path");
const fs = require("fs").promises;

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const crypto = require("crypto");
const { PDFParse } = require("pdf-parse");

const Document = db.Document;
const Organizaion = db.Organization;

const uploadDocuments = asyncHandler(async (req, res) => {
  // 1. Check if any files arrived
  if (!req.file) {
    throw new ApiError(
      400,
      "No file uploaded. Please attach at least one file.",
    );
  }

  const orgId = req.organization.id;
  if (!orgId) {
    throw new ApiError(400, "Organization ID is required to link documents.");
  }

  //AWS S3 Logic for generating url

  // 2. Map through req.files (works for 1 or many)
  const documentRecord = {
    docType: req.file?.mimetype, // e.g. 'application/pdf' or 'image/png'
    docUrl: `/public/${req.file?.filename}`, // Path saved in DB
    orgId: parseInt(orgId),
  };

  // 3. Bulk Insert (Highly efficient for single or multiple records)
  const savedDoc = await Document.create(documentRecord);

  if (!savedDoc) {
    throw new ApiError(403, "Error in Saving Document");
  }

  //Document removed from server logic

  res.json(new ApiResponse(201, savedDoc, `saved successfully`));
});

const getMyDocuments = asyncHandler(async (req, res) => {
  const organizationId = req.organization?.id;

  if (!organizationId) {
    throw new ApiError(
      401,
      "Unauthorized: Organization ID missing from request",
    );
  }

  // 2. Fetch the documents linked to this specific orgId
  const documents = await Document.findAll({
    where: { orgId: organizationId },
    order: [["createdAt", "DESC"]], // Show newest first
    attributes: ["id", "docType", "docUrl", "createdAt"], // Security: don't return orgId if not needed
  });

  if (!documents) {
    throw new ApiError(400, "Cant Get Documents");
  }

  // 3. Return the list
  res.json(new ApiResponse(200, documents, "All Documents"));
});

const deleteDocument = asyncHandler(async (req, res) => {
  const organizationId = req.organization?.id;
  const { id } = req.params;

  if (!organizationId) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const document = await Document.findOne({
    where: { id, orgId: organizationId },
  });

  if (!document) {
    throw new ApiError(404, "Document not found or access denied");
  }

  const fileName = path.basename(document.docUrl);
  const filePath = path.join(__dirname, "../../public", fileName);

  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error(
      "File deletion failed, might not exist on disk:",
      err.message,
    );
  }

  await document.destroy();

  res.json(new ApiResponse(200, null, "Document deleted successfully"));
});

// upsertFile
const upsertFile = asyncHandler(async (req, res) => {
  const businessId = req.organization.id;

  if (!req.file) throw new ApiError(400, "No file uploaded.");

  // 1. Get the Unit8Array text
  const dataBuffer = await fs.readFile(req.file.path);
  const pdfDataUint = new Uint8Array(dataBuffer);

  // 2. create an instance of pdfParse
  const parser = new PDFParse(pdfDataUint);
  // OR
  // const parser = new PDFParse({ url: "https://bitcoin.org/bitcoin.pdf" });
  const pdfData = await parser.getText();

  console.log(pdfData);

  // Clean the text to remove \n and extra spaces
  const cleanText = pdfData.text
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 3. Define the Splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 10,
  });

  // 4. Split the text you just got from pdfData
  const chunks = await splitter.splitText(cleanText);

  const uuid = crypto.randomUUID();

  // 5. Prepare Records for Pinecone
  const records = chunks.map((chunk, i) => ({
    id: `${uuid}-${i}`,
    chunk_text: chunk,
    filename: String(req.file.originalname),
    original_text: chunk.toString(),
    total_pages: Number(pdfData.total || 0),
  }));

  // 6. Upsert to Pinecone
  const index = req.app.locals.pineconeIndex;

  await index.namespace(String(businessId)).upsertRecords({
    records: records,
  });

  res.json(
    new ApiResponse(
      201,
      {
        filename: req.file.originalname,
        businessId: String(businessId),
        chunksCreated: chunks.length,
      },
      `Successfully processed and embedded ${chunks.length} chunks.`,
    ),
  );
});

module.exports = {
  uploadDocuments,
  getMyDocuments,
  deleteDocument,
  upsertFile,
};
