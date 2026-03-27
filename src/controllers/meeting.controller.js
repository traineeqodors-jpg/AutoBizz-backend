const db = require("../../db/models");
const Meeting = db.Meeting
const Lead = db.Lead

const { Op } = require("sequelize");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");

const getAllMeetings = asyncHandler(async (req, res) => {

    const orgId = req.organization?.id

  const { 
    
    startDate, 
    endDate, 
    limit = 50, 
    page = 1 
  } = req.query;

  // 1. Validation: orgId is mandatory for multi-tenant safety
  if (!orgId) {
    throw new ApiError(400, "Organization ID is required to fetch meetings");
  }

  // 2. Build Query Conditions
  const queryConditions = { orgId };

  // 3. Optional Date Range Filter
  if (startDate && endDate) {
    queryConditions.startTime = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  const offset = (page - 1) * limit;

  // 4. Fetch Data with Eager Loading
  const { count, rows } = await Meeting.findAndCountAll({
    where: queryConditions,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["startTime", "ASC"]],
    include: [
      {
        model: Lead,
        as: "lead", // Ensure this matches your Meeting model association alias
        attributes: ["id", "name", "email", "company", "status"],
      },
    ],
  });

  // 5. Return Structured Response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200, 
        {
          meetings: rows,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
          },
        }, 
        "Meetings retrieved successfully"
      )
    );
});

module.exports = { getAllMeetings };
