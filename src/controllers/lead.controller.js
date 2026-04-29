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

// Add Leads
const addLead = asyncHandler(async (req, res) => {
  const businessId = req.user?.orgId || req.user?.id;

  // MANUAL LEAD ADD
  if (!req.file) {
    const { name, email, phone, companyName } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing lead
    const existingLead = await Lead.findOne({
      where: {
        orgId: businessId,
        email: normalizedEmail,
      },
    });

    if (existingLead) {
      throw new ApiError(400, "Leads with this email already exists!!");
    }

    let lead = await Lead.create({
      orgId: businessId,
      name: name || "Unknown",
      email: normalizedEmail,
      phone,
      company: companyName,
      status: "new",
      confidence_score: 0,
      metadata: {
        imported_at: new Date(),
        source: "Manual Entry",
        original_notes: "",
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, lead, "Lead created successfully."));
  }

  // CSV UPLOAD FLOW
  // Validate file upload
  if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
    if (req.file) fs.unlinkSync(req.file.path);
    throw new ApiError(400, "Please upload a valid CSV file.");
  }

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

  // const leadIds = savedLeads.map((l) => l.id);

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

  // detect filters
  const hasFilters = !!(search || status || minScore || startDate || endDate);

  const baseCondition = {
    orgId: businessId,
  };

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

  // TOTAL WITHOUT FILTERS
  const totalUnfilteredCount = await Lead.count({
    where: baseCondition,
  });

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
        hasFilters,
        totalUnfilteredCount,
        hasAnyData: totalUnfilteredCount > 0,

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

  // respond immediately (Twilio requirement)
  res.sendStatus(200);

  // background processing (non-blocking)
  try {
    // Update call status
    await db.CallLog.update(
      {
        status: CallStatus,
        duration: CallDuration ? parseInt(CallDuration) : 0,
      },
      { where: { callSid: CallSid } },
    );

    // Fetch full call logs
    const logs = await db.CallLog.findAll({
      where: { callSid: CallSid },
      order: [["createdAt", "ASC"]],
    });

    // Build clean transcript
    const transcript = logs
      .map((l) => {
        if (l.role === "AI") return `Agent: ${l.transcript}`;
        return `User: ${l.transcript}`;
      })
      .join("\n");
    if (!logs.length) return;

    // Run AI scoring
    const scoringResult = await calculateLeadScore(transcript);

    let score = Number(scoringResult?.score || 10);
    if (isNaN(score)) score = 10;

    score = Math.round(score);

    // Determine lead status
    let status = "cold";

    if (score >= 80) status = "hot";
    else if (score >= 60) status = "warm";
    else if (score >= 40) status = "contacted";

    // Update lead
    await db.Lead.update(
      {
        confidence_score: score,
        status,
      },
      { where: { id: leadId } },
    );

    // Emit realtime update
    const io = req.app.get("io");
    io.emit(`lead-scored-${orgId}`, { leadId, score });
  } catch (error) {}

  // (async () => {
  //   try {
  //     await db.CallLog.update(
  //       {
  //         status: CallStatus,
  //         duration: CallDuration ? parseInt(CallDuration) : 0,
  //       },
  //       { where: { callSid: CallSid } },
  //     );

  //     const logs = await db.CallLog.findAll({
  //       where: { callSid: CallSid },
  //       order: [["createdAt", "ASC"]],
  //     });

  //     if (!logs || logs.length === 0) return;

  //     const transcript = logs.map((l) => l.transcript || l.message).join("\n");

  //     const scoringResult = await calculateLeadScore(transcript);

  //     if (!scoringResult) {
  //       throw new ApiError(400, "Error while Generating Score of Lead");
  //     }

  //     let leadScore = Number(scoringResult?.score);
  //     if (isNaN(leadScore)) leadScore = 10;
  //     leadScore = Math.round(leadScore);

  //     await db.Lead.update(
  //       {
  //         confidence_score: leadScore,
  //         status: leadScore > 70 ? "warm" : "contacted",
  //       },
  //       { where: { id: leadId }, individualHooks: true },
  //     );

  //     const io = req.app.get("io");
  //     io.emit(`lead-scored-${orgId}`, { leadId, score: leadScore });
  //   } catch (error) {
  //     console.error(" Background Scoring Failed:", error.message);
  //   }
  // })();
});

const callSelectedLead = asyncHandler(async (req, res) => {
  const { leadIds } = req.body;

  const orgId = req.user?.orgId || req.user?.id;

  // io injection
  const io = req.app.get("io");

  // validation
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    throw new ApiError(400, "leadIds must be a non-empty array");
  }

  // ensure leads belong to this org
  const leads = await Lead.findAll({
    where: {
      id: leadIds,
      orgId,
    },
  });

  if (leads.length === 0) {
    throw new ApiError(404, "No valid leads found");
  }

  const validLeadIds = leads.map((l) => l.id);

  // Background job trigger
  startQualificationBatch(validLeadIds, orgId, io, client, BASE_URL).catch(
    (err) => console.error("Single Call Failed :", err),
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Call process started successfully"));
});

module.exports = {
  addLead,
  getAllLeads,
  deleteLead,
  finalizeCallAndScore,
  callSelectedLead,
};
