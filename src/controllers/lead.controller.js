"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const fs = require("fs");
const crypto = require("crypto");
const csv = require("csv-parser");
const { Op } = require("sequelize");

const twilio = require("twilio");
const { calculateLeadScore } = require("../services/leadScoring.services");
const { default: axios } = require("axios");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
const BASE_URL = process.env.BASE_URL;

const Lead = db.Lead;

const addLead = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.originalname.toLowerCase().endsWith(".csv")) {
    if (req.file) fs.unlinkSync(req.file.path);
    throw new ApiError(400, "Please upload a valid CSV file.");
  }

  const businessId = req.organization.id;
  const filePath = req.file.path;
  const leads = [];

  // 1. CONTENT VALIDATION
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash("md5").update(fileBuffer).digest("hex");

  const isBinary = fileBuffer.slice(0, 100).some((byte) => byte === 0);
  if (isBinary) {
    fs.unlinkSync(filePath);
    throw new ApiError(
      400,
      "Invalid file content. The file appears to be a binary, not a CSV.",
    );
  }

  // 2. DUPLICATE FILE CHECK
  const duplicateFile = await Lead.findOne({
    where: {
      orgId: businessId,
      "metadata.file_hash": fileHash,
    },
  });

  if (duplicateFile) {
    fs.unlinkSync(filePath);
    throw new ApiError(400, "This file content has already been uploaded.");
  }

  // 3. PARSING
  const parsePromise = new Promise((resolve, reject) => {
    let isFirstRow = true;
    const requiredHeaders = ["Lead Owner", "Email 1", "Phone 1", "Company"];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (isFirstRow) {
          const rowHeaders = Object.keys(row);
          const hasAllHeaders = requiredHeaders.every((h) =>
            rowHeaders.includes(h),
          );
          if (!hasAllHeaders) {
            reject(
              new ApiError(
                400,
                `CSV Header mismatch. Required: ${requiredHeaders.join(", ")}`,
              ),
            );
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
            original_filename: req.file.originalname,
          },
        });
      })
      .on("end", resolve)
      .on("error", (error) => reject(error));
  });

  await parsePromise;

  // Cleanup file immediately after parsing is successful
  fs.unlinkSync(filePath);

  if (leads.length === 0) throw new ApiError(400, "CSV is empty.");

  // 4. DATABASE UPSERT
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

  // 5. BACKGROUND BATCH TRIGGER
  const leadIds = savedLeads.map((l) => l.id);

  axios
    .post(
      `http://192.168.0.37:${process.env.PORT || 5000}/api/voice/batch-qualify`,
      {
        leadIds,
        orgId: businessId,
      },
    )
    .catch((err) => console.error("Background Batch Trigger Failed:", err));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: leads.length },
        "Import successful. AI processing started.",
      ),
    );
});

const addLeadForm = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { name, email, subject, phone, message, company, orgId } = req.body;

  console.log(req.body);
  if (!name || !email || !subject || !phone || !message || !orgId) {
    throw new ApiError(400, "All fields are mandatory");
  }

  let lead = await Lead.findOne({ where: { email, orgId } });

  const newMessageEntry = {
    subject,
    message,
    timestamp: new Date().toISOString(),
  };

  if (lead) {
    const updatedMetadata = Array.isArray(lead.metadata?.history)
      ? [...lead.metadata.history, newMessageEntry]
      : [newMessageEntry];

    const newScore = Math.min((lead.confidence_score || 0) + 15, 100);

    await lead.update(
      {
        name,
        phone,
        confidence_score: newScore,
        metadata: { history: updatedMetadata },
      },
      {
        individualHooks: true,
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, lead, "We will back to you soon again"));
  } else {
    // 4. CREATE NEW LEAD
    const newLead = await Lead.create({
      orgId,
      name,
      email,
      phone,
      company: company || "N/A",
      status: "new",
      confidence_score: 20,
      metadata: { history: [newMessageEntry] },
      meeting_scheduled: false,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newLead,
          "Thank You for filling the form ,we will contact you soon",
        ),
      );
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
    endDate, // Format: YYYY-MM-DD
    sortBy = "createdAt",
    order = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const businessId = req.organization.id;

  // 1. Security Whitelist for sorting
  const validSortColumns = [
    "createdAt",
    "confidence_score",
    "name",
    "email",
    "company",
  ];
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
  if (minScore)
    queryConditions.confidence_score = { [Op.gte]: parseInt(minScore) };

  // 5. Date Range Filter
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

  // 6. Execute Query
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

const startQualificationBatch = asyncHandler(async (req, res) => {
  const { leadIds, orgId } = req.body;
  const io = req.app.get("io"); // 🔌 Access socket instance

  const leads = await db.Lead.findAll({ where: { id: leadIds } });

  res.json({ message: "Batch processing started" });

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    // 🛡️ Stagger calls to protect Ollama
    await new Promise((resolve) => setTimeout(resolve, 4000));

    try {
      await client.calls.create({
        to: lead.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${process.env.BASE_URL}/api/voice?orgId=${orgId}&leadId=${lead.id}`,
        method: "POST",
        statusCallback: `${BASE_URL}/api/voice/callback?orgId=${orgId}&leadId=${lead.id}`,
        statusCallbackEvent: ["completed"],
      });

      console.log("Working of calls");

      // 📢 Emit progress to the specific organization's room
      io.emit(`batch-update-${orgId}`, {
        message: `Calling ${lead.name}...`,
        current: i + 1,
        total: leads.length,
        status: "processing",
      });
    } catch (err) {
      console.error(`Twilio Error for ${lead.name}:`, err.message);
    }
  }

  // ✅ Final signal
  io.emit(`batch-update-${orgId}`, {
    message: "Batch qualification finished!",
    status: "completed",
  });
});

const finalizeCallAndScore = asyncHandler(async (req, res) => {
  const { leadId, orgId } = req.query;
  const { CallStatus, CallDuration, CallSid } = req.body;

  // 1. Respond to Twilio IMMEDIATELY (Stops the 30s timeout)
  res.sendStatus(200);

  // 2. Run the rest in the background (No 'await' on the heavy stuff)
  (async () => {
    try {
      console.log(`Background Scoring Started for Lead: ${leadId}`);

      // Update CallLog status/duration
      await db.CallLog.update(
        {
          status: CallStatus,
          duration: CallDuration ? parseInt(CallDuration) : 0,
        },
        { where: { callSid: CallSid } },
      );

      // Fetch logs for transcript
      const logs = await db.CallLog.findAll({
        where: { callSid: CallSid },
        order: [["createdAt", "ASC"]],
      });

      if (!logs || logs.length === 0) return;

      const transcript = logs.map((l) => l.transcript || l.message).join("\n");

      // AI Scoring (The slow part)
      const scoringResult = await calculateLeadScore(transcript);

      let leadScore = Number(scoringResult?.score);
      if (isNaN(leadScore)) leadScore = 10;
      leadScore = Math.round(leadScore);

      // Update Lead Table
      await db.Lead.update(
        {
          confidence_score: leadScore,
          status: leadScore > 70 ? "qualified" : "nurture",
        },
        { where: { id: leadId }, individualHooks: true },
      );

      // Notify Frontend via Socket
      const io = req.app.get("io");
      io.emit(`lead-scored-${orgId}`, { leadId, score: leadScore });

      console.log(`Background Scoring Complete: ${leadScore}`);
    } catch (error) {
      console.error("Background Scoring Failed:", error.message);
    }
  })();
});

module.exports = {
  addLead,
  getAllLeads,
  deleteLead,
  startQualificationBatch,
  finalizeCallAndScore,
  addLeadForm,
};
