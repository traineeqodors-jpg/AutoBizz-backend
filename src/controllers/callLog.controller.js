"use strict";
const { Op } = require("sequelize");
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const CallLog = db.CallLog;




const getAllCallLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    startDate,
    endDate,
    sortBy = "createdAt",
    order = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const orgId = req.organization?.id; 

 
  const validSortColumns = ["createdAt", "duration", "status", "callSid", "to", "from"];
  const sortField = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";


  const queryConditions = {
    orgId: orgId,
  };

  if (search) {
    queryConditions[Op.or] = [
      { transcript: { [Op.iLike]: `%${search}%` } },
      { to: { [Op.iLike]: `%${search}%` } },
      { from: { [Op.iLike]: `%${search}%` } },
      { callSid: { [Op.iLike]: `%${search}%` } },
    ];
  }


  if (status) queryConditions.status = status;


  if (startDate || endDate) {
    queryConditions.createdAt = {};
    if (startDate) {
      queryConditions.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      queryConditions.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  
  const { count, rows } = await CallLog.findAndCountAll({
    where: queryConditions,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortField, sortOrder]],
 
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
        },
        filters: { search, status, startDate, endDate }
      },
      "Call Logs retrieved successfully"
    )
  );
});



const getIndividualCallLogs = asyncHandler (async (req,res) => {


    const { id } = req.params;

    const callLog = await CallLog.findByPk(id)

    if(!callLog){
        throw new ApiError(404 , "CallLog not found or deleted")
    }

    res.json(new ApiResponse(200 , callLog , "Call Log"))
})

const deleteCallLog = asyncHandler(async (req,res) => {

    const { id } = req.params

    const callLog = await CallLog.findOne({
        where : {
            id , orgId : req.organization?.id
        }
    })

    if(!callLog){
        throw new ApiError(400 , "Call log not found or corrupted")
    }

    await callLog.destroy();

    res.json(new ApiResponse(200 , {} , "Call Log Deleted SuccessFully"))
    

})

module.exports = { getAllCallLogs , getIndividualCallLogs , deleteCallLog}
