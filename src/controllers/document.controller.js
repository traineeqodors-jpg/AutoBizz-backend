"use strict";
const db = require("../../db/models");
const { upsertFileService } = require("../services/upsertVectorDoc");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const path = require("path");
const fs = require("fs").promises;

const Document = db.Document;

const uploadDocuments = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      400,
      "No file uploaded. Please attach at least one file.",
    );
  }

  const index = req.app.locals.pineconeIndex;
  const io = req.app.get("io");

  const orgId = req.user?.ordId || req.user?.id;
  if (!orgId) {
    throw new ApiError(400, "Organization ID is required to link documents.");
  }

  const existingDoc = await Document.findOne({
    where: {
      orgId: orgId,
      originalName: req.file.originalname,
    },
  });

  if (existingDoc) {
    throw new ApiError(409, "This document already exists!!.");
  }

  const uuid = crypto.randomUUID();

  //AWS S3 Logic for generating url

  const documentRecord = {
    docType: req.file?.mimetype,
    docUrl: `/public/${req.file?.filename}`,
    originalName: req.file.originalname,
    orgId: parseInt(orgId),
    pineconeId: uuid,
  };

  const savedDoc = await Document.create(documentRecord);

  if (!savedDoc) {
    throw new ApiError(403, "Error in Saving Document");
  }

  console.log(uuid);

  res.json(
    new ApiResponse(201, savedDoc, "File uploaded. Processing started."),
  );

  upsertFileService({ file: req.file, businessId: orgId, index, uuid })
    .then(() => {
      console.log("Emitting to:", `user_${req.user.id}`);

      io.to(`user_${req.user.id}`).emit("document-status", {
        uuid,
        status: "completed",
        message: "Document processed successfully",
      });
    })
    .catch((error) => {
      console.error(error);

      io.to(`user_${req.user.id}`).emit("document-status", {
        uuid,
        status: "failed",
        message: "Document processing failed",
      });
    });
});

const getMyDocuments = asyncHandler(async (req, res) => {
  const organizationId = req.user?.ordId || req.user?.id;

  if (!organizationId) {
    throw new ApiError(
      401,
      "Unauthorized: Organization ID missing from request",
    );
  }

  const documents = await Document.findAll({
    where: { orgId: organizationId },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "docType", "pineconeId", "docUrl", "createdAt"],
  });

  if (!documents) {
    throw new ApiError(400, "Cant Get Documents");
  }

  res.json(new ApiResponse(200, documents, "All Documents"));
});

const deleteDocument = asyncHandler(async (req, res) => {
  const organizationId = req.user?.ordId || req.user?.id;
  const { id } = req.params;

  const index = req.app.locals.pineconeIndex;

  if (!organizationId) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const document = await Document.findOne({
    where: { id, orgId: organizationId },
  });

  console.log(document.pineconeId);

  if (!document) {
    throw new ApiError(404, "Document not found or access denied");
  }

  const fileName = path.basename(document.docUrl);
  const filePath = path.join(__dirname, "../../public", fileName);

  try {
    await fs.unlink(filePath);
    await index.namespace(String(organizationId)).deleteMany({
      filter: {
        file_uuid: { $eq: document.pineconeId },
      },
    });
  } catch (err) {
    console.error(
      "File deletion failed, might not exist on disk:",
      err.message,
    );
  }

  await document.destroy();

  res.json(new ApiResponse(200, null, "Document deleted successfully"));
});

module.exports = { uploadDocuments, getMyDocuments, deleteDocument };