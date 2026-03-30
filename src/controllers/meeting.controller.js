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

  
  if (!orgId) {
    throw new ApiError(400, "Organization ID is required to fetch meetings");
  }

 
  const queryConditions = { orgId };


  if (startDate && endDate) {
    queryConditions.startTime = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  const offset = (page - 1) * limit;


  const { count, rows } = await Meeting.findAndCountAll({
    where: queryConditions,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["startTime", "ASC"]],
    include: [
      {
        model: Lead,
        as: "lead", 
        attributes: ["id", "name", "email", "company", "status"],
      },
    ],
  });


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
