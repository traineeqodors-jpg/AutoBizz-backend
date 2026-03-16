"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const CallLog = db.CallLog;


const getAllCallLogs = asyncHandler(async (req, res) => {

  const callLogs = await CallLog.findAll({
    where: {
      orgId: req.organization?.id,
    },
    order: [["createdAt", "DESC"]],
    attributes : {
        exclude : ["orgId"]
    }
   // Show newest first
  });

 
  res.json(new ApiResponse(200 , callLogs || [] , "Call Logs Found"))

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
        throw new ApiError(400 , "Call log not found or corupted")
    }

    await callLog.destroy();

    res.json(new ApiResponse(200 , {} , "Call Log Deleted SuccessFully"))
    

})

module.exports = { getAllCallLogs , getIndividualCallLogs , deleteCallLog}
