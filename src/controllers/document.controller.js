"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const path = require("path")
const fs = require("fs").promises;



const Document = db.Document;
const Organizaion = db.Organization

const uploadDocuments = asyncHandler(async (req, res) => {
  // 1. Check if any files arrived
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded. Please attach at least one file.");
  }

  const orgId = req.organization.id;
  if (!orgId) {
    throw new ApiError(400, "Organization ID is required to link documents.");
  }

  //AWS S3 Logic for generating url

  // 2. Map through req.files (works for 1 or many)
  const documentRecords = req.files.map((file) => ({
    docType: file.mimetype,              // e.g. 'application/pdf' or 'image/png'
    docUrl: `/public/${file.filename}`,  // Path saved in DB
    orgId: parseInt(orgId),
  }));

  // 3. Bulk Insert (Highly efficient for single or multiple records)
  const savedDocs = await Document.bulkCreate(documentRecords);

  if(!savedDocs){
   throw new ApiError(403 , "Error in Saving Document")
  }

  //Document removed from server logic

  res.json(
    new ApiResponse(201 , savedDocs , `${savedDocs?.length} "saved successfully`)
   
  );
});




const getMyDocuments = asyncHandler(async (req, res) => {
  const organizationId = req.organization?.id;

  if (!organizationId) {
    throw new ApiError(401, "Unauthorized: Organization ID missing from request");
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
  res.json(new ApiResponse(200 , documents , "All Documents"))
 
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
    console.error("File deletion failed, might not exist on disk:", err.message);
  }

  await document.destroy();

  res.json(new ApiResponse(200, null, "Document deleted successfully"));
});





module.exports = { uploadDocuments , getMyDocuments , deleteDocument}
