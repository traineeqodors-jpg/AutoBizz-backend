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
const { calculateLeadScore } = require("../services/rag.services");
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

  const businessId = req.organization?.id || req.employee?.orgId;
  const filePath = req.file.path;
  const leads = [];

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

            fs.unlinkSync(filePath);
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
  fs.unlinkSync(filePath);

  if (leads.length === 0) throw new ApiError(400, "CSV is empty.");

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
    throw new ApiError(400, "Cannot Insert leads in bulk");
  }

  const leadIds = savedLeads.map((l) => l.id);

  axios
    .post(`${process.env.BACKEND_URL}/api/voice/batch-qualify`, {
      leadIds,
      orgId: businessId,
    })
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
  console.log(req.organization, "req.organization");
  console.log(req.employee, "req.employee");
  const businessId = req.organization?.id || req.employee?.orgId;

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

const startQualificationBatch = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { leadIds, orgId } = req.body;
  const io = req.app.get("io");
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  const socketDelay = () => new Promise((resolve) => setTimeout(resolve, 2000));

  const leads = await db.Lead.findAll({ where: { id: leadIds } });

  res.json({ message: "Batch processing started" });

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (!lead.phone || !phoneRegex.test(lead.phone.replace(/\s/g, ""))) {
      console.error(`Skipping ${lead.name}: Malformed number ${lead.phone}`);
      io.emit(`batch-update-${orgId}`, {
        message: `Skipping ${lead.name}: Invalid format`,
        status: "warning",
      });
      await socketDelay();
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 6000));

    try {
      const lookup = await client.lookups.v2.phoneNumbers(lead.phone).fetch();

      if (!lookup.valid) {
        throw new Error(
          "Number is technically valid but not reachable/active.",
        );
      }

      await client.calls.create({
        to: lead.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${BASE_URL}/api/voice?orgId=${orgId}&leadId=${lead.id}`,
        method: "POST",
        statusCallback: `${BASE_URL}/api/voice/callback?orgId=${orgId}&leadId=${lead.id}`,
        statusCallbackEvent: ["completed"],
      });

      io.emit(`batch-update-${orgId}`, {
        message: `Calling ${lead.name}...`,
        current: i + 1,
        total: leads.length,
        status: "processing",
      });
      await socketDelay();

      console.log("Working of calls");
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 21211)
        errorMessage = "Invalid 'To' Phone Number (Twilio Check).";
      if (err.code === 21614)
        errorMessage = "To number is not a valid mobile/landline.";
      if (err.code === 21408)
        errorMessage =
          "Permission denied for this country (check Geo-Permissions).";

      console.error(`Twilio Error [${lead.name}]:`, errorMessage);

      io.emit(`batch-update-${orgId}`, {
        message: `Error calling ${lead.name}: ${errorMessage}`,
        status: "error",
      });
      await socketDelay();
    }
  }

  io.emit(`batch-update-${orgId}`, {
    message: "Batch qualification finished!",
    status: "success",
  });
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
  startQualificationBatch,
  finalizeCallAndScore,
};
