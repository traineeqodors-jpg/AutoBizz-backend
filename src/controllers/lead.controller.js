const fs = require("fs");
const crypto = require("crypto");

const twilio = require("twilio");
const csv = require("csv-parser");
const { Op } = require("sequelize");

const db = require("../../db/models");

const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const { calculateLeadScore } = require("../services/rag.services");
const {
  startQualificationBatch,
} = require("../services/startQualificationBatch");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
const BASE_URL = process.env.BASE_URL;

const Lead = db.Lead;

const addLead = asyncHandler(async (req, res) => {
  // Validate file upload
  if (!req.file || !req.file.originalname.toLowerCase().endsWith(".csv")) {
    if (req.file) fs.unlinkSync(req.file.path);
    throw new ApiError(400, "Please upload a valid CSV file.");
  }

  const businessId = req.user?.orgId || req.user?.id;
  const filePath = req.file.path;
  const leads = [];

  // avoid blocking event loop
  const fileBuffer = await fs.promises.readFile(filePath);

  // File hash for deduplication
  const fileHash = crypto.createHash("md5").update(fileBuffer).digest("hex");

  // Binary file check
  const isBinary = fileBuffer.slice(0, 100).some((byte) => byte === 0);
  if (isBinary) {
    fs.unlinkSync(filePath);
    throw new ApiError(
      400,
      "Invalid file content. The file appears to be binary, not CSV.",
    );
  }

  // Duplicate file check
  const duplicateFile = await Lead.findOne({
    where: {
      orgId: businessId,
      "metadata.file_hash": fileHash, // NOTE: better if this becomes a DB column
    },
  });

  if (duplicateFile) {
    fs.unlinkSync(filePath);
    throw new ApiError(400, "This file content has already been uploaded.");
  }

  // safer CSV stream handling
  const parsePromise = new Promise((resolve, reject) => {
    let isFirstRow = true;

    // normalize headers
    const requiredHeaders = ["lead owner", "email 1", "phone 1", "company"];

    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on("data", (row) => {
      try {
        // Normalize headers for comparison
        if (isFirstRow) {
          const rowHeaders = Object.keys(row).map((h) =>
            h.trim().toLowerCase(),
          );

          const hasAllHeaders = requiredHeaders.every((h) =>
            rowHeaders.includes(h),
          );

          if (!hasAllHeaders) {
            // stop stream
            stream.destroy(
              new ApiError(
                400,
                `CSV Header mismatch. Required: ${requiredHeaders.join(", ")}`,
              ),
            );
            return;
          }

          isFirstRow = false;
        }

        // skip invalid rows (prevents bad DB data)
        if (!row["Email 1"] || !row["Phone 1"]) return;

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
            original_filename: req.file.originalname,
          },
        });
      } catch (err) {
        stream.destroy(err);
      }
    });

    stream.on("error", reject);
    stream.on("end", resolve);
  });

  //ensure file cleanup always happens
  try {
    await parsePromise;
  } finally {
    fs.unlinkSync(filePath); // always cleanup
  }

  // Empty CSV check
  if (leads.length === 0) {
    throw new ApiError(400, "CSV is empty or invalid.");
  }

  // safer bulk insert
  const savedLeads = await Lead.bulkCreate(leads, {
    conflictAttributes: ["email"],
    updateOnDuplicate: [
      "orgId",
      "name",
      "phone",
      "company",
      "confidence_score",
      "updatedAt",
    ],
  });

  if (!savedLeads) {
    throw new ApiError(400, "Cannot insert leads in bulk");
  }

  const leadIds = savedLeads.map((l) => l.id);

  // io injection
  const io = req.app.get("io");

  // Background job trigger
  startQualificationBatch(leadIds, businessId, io, client, BASE_URL).catch(
    (err) => console.error("Background Batch Trigger Failed:", err),
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: leads.length,
        inserted: savedLeads.length,
      },
      "Import successful. AI processing started.",
    ),
  );
});

const getAllLeads = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    minScore,
    startDate,
    endDate,
    sortBy = "createdAt",
    order = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  const businessId = req.user?.orgId || req.user?.id;

  const validSortColumns = [
    "createdAt",
    "confidence_score",
    "name",
    "email",
    "company",
  ];
  const sortField = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const queryConditions = {
    orgId: businessId,
  };

  if (search) {
    queryConditions[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (status) queryConditions.status = status;
  if (minScore)
    queryConditions.confidence_score = { [Op.gte]: parseInt(minScore) };

  if (startDate || endDate) {
    queryConditions.createdAt = {};
    if (startDate) {
      queryConditions.createdAt[Op.gte] = new Date(
        `${startDate}T00:00:00.000Z`,
      );
    }
    if (endDate) {
      queryConditions.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  const { count, rows } = await Lead.findAndCountAll({
    where: queryConditions,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [
      [sortField, sortOrder],
      ["id", "ASC"],
    ],
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
          limit: parseInt(limit),
        },
        filters: { search, status, minScore, startDate, endDate },
        activeSort: { field: sortField, order: sortOrder },
      },
      "Leads retrieved successfully",
    ),
  );
});

const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Id Not Found");
  }

  const lead = await Lead.findByPk(id);
  if (!lead) {
    throw new ApiError(403, "Lead Not Exists or might be deleted");
  }

  await lead.destroy();

  res.json(new ApiResponse(200, null, "Lead deleted successfully"));
});

const finalizeCallAndScore = asyncHandler(async (req, res) => {
  const { leadId, orgId } = req.query;
  const { CallStatus, CallDuration, CallSid } = req.body;

  res.sendStatus(200);

  (async () => {
    try {
      await db.CallLog.update(
        {
          status: CallStatus,
          duration: CallDuration ? parseInt(CallDuration) : 0,
        },
        { where: { callSid: CallSid } },
      );

      const logs = await db.CallLog.findAll({
        where: { callSid: CallSid },
        order: [["createdAt", "ASC"]],
      });

      if (!logs || logs.length === 0) return;

      const transcript = logs.map((l) => l.transcript || l.message).join("\n");

      const scoringResult = await calculateLeadScore(transcript);

      if (!scoringResult) {
        throw new ApiError(400, "Error while Generating Score of Lead");
      }

      let leadScore = Number(scoringResult?.score);
      if (isNaN(leadScore)) leadScore = 10;
      leadScore = Math.round(leadScore);

      await db.Lead.update(
        {
          confidence_score: leadScore,
          status: leadScore > 70 ? "warm" : "contacted",
        },
        { where: { id: leadId }, individualHooks: true },
      );

      const io = req.app.get("io");
      io.emit(`lead-scored-${orgId}`, { leadId, score: leadScore });
    } catch (error) {
      console.error(" Background Scoring Failed:", error.message);
    }
  })();
});

module.exports = {
  addLead,
  getAllLeads,
  deleteLead,
  finalizeCallAndScore,
};
