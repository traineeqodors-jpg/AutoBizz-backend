"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
 
const fs = require("fs");
const crypto = require("crypto")
const csv = require("csv-parser");
const { Op } = require("sequelize");
 
const Lead = db.Lead;
 
const addLead = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please upload a CSV file.");

  const businessId = req.organization.id;
  const filePath = req.file.path;
  const leads = [];

  // 1. CONTENT VALIDATION: Generate a unique hash for the file content
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

  // Check if any existing lead has this file hash in its metadata
  const duplicateFile = await Lead.findOne({
    where: {
      orgId: businessId,
      'metadata.file_hash': fileHash // Querying inside JSONB field
    }
  });

  if (duplicateFile) {
    fs.unlinkSync(filePath); // Delete temp file
    throw new ApiError(400, "This file content has already been uploaded (even if renamed).");
  }

  // 2. HEADER VALIDATION: Ensure CSV headers match your Lead table
  const parsePromise = new Promise((resolve, reject) => {
    let isFirstRow = true;
    const requiredHeaders = ["Lead Owner", "Email 1", "Phone 1", "Company"];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (isFirstRow) {
          const rowHeaders = Object.keys(row);
          const hasAllHeaders = requiredHeaders.every(h => rowHeaders.includes(h));
          if (!hasAllHeaders) {
            reject(new Error(`CSV Header mismatch. Required: ${requiredHeaders.join(", ")}`));
          }
          isFirstRow = false;
        }

        leads.push({
          orgId: businessId,
          name: row["Lead Owner"] || "Unknown",
          email: row["Email 1"],
          phone: row["Phone 1"],
          company: row["Company"],
          status: "new",
          confidence_score: parseInt(row["confidence_score"]) || 0,
          metadata: {
            imported_at: new Date(),
            source: row["Source"] || "CSV Upload",
            original_notes: row["Notes"] || "",
            file_hash: fileHash, 
            original_filename: req.file.originalname
          },
        });
      })
      .on("end", resolve)
      .on("error", (error) => reject(error));
  });

  try {
    await parsePromise;

    // 3. ROW VALIDATION: Prevent empty uploads
    if (leads.length === 0) throw new ApiError(400, "CSV is empty.");

    // 4. UPSERT: Handles row-level duplicates (same email)
    await Lead.bulkCreate(leads, {
      updateOnDuplicate: ["name", "phone", "company", "confidence_score", "updatedAt"],
    });

    fs.unlinkSync(filePath);
    return res.status(200).json(new ApiResponse(200, { count: leads.length }, "Import successful."));

  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.log(error)
    throw new ApiError(400, error.message);
  }
});

const getAllLeads = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search = "", 
    status, 
    minScore,
    startDate, // Format: YYYY-MM-DD
    endDate,   // Format: YYYY-MM-DD
    sortBy = "createdAt", 
    order = "DESC" 
  } = req.query;

  const offset = (page - 1) * limit;
  const businessId = req.organization.id;

  // 1. Security Whitelist for sorting
  const validSortColumns = ["createdAt", "confidence_score", "name", "email", "company"];
  const sortField = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  // 2. Base Query (Scoped to Organization)
  const queryConditions = {
    orgId: businessId,
  };

  // 3. Search Logic (Name, Email, Company)
  if (search) {
    queryConditions[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // 4. Status and Score Filters
  if (status) queryConditions.status = status;
  if (minScore) queryConditions.confidence_score = { [Op.gte]: parseInt(minScore) };

  // 5. Date Range Filter
  if (startDate || endDate) {
    queryConditions.createdAt = {};
    if (startDate) {
      queryConditions.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      queryConditions.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  // 6. Execute Query
  const { count, rows } = await Lead.findAndCountAll({
    where: queryConditions,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortField, sortOrder]],
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        leads: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        },
        filters: { search, status, minScore, startDate, endDate },
        activeSort: { field: sortField, order: sortOrder }
      },
      "Leads retrieved successfully"
    )
  );
});

const deleteLead = asyncHandler(async(req,res) => {
    const {id} = req.params;
    if(!id){
        throw new ApiError(400 , "Id Not Found")
    }

    const lead = await Lead.findByPk(id);
    if(!lead){
        throw new ApiError(403 , "Lead Not Exists or might be deleted")
    }

    await lead.destroy();

    res.json(new ApiResponse(200, null, "Lead deleted successfully"));
})


 
module.exports = { addLead , getAllLeads , deleteLead};
 
 