"use strict";
const db = require("../../db/models");
const { getLeadAnalysis } = require("../services/lead.services");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const Lead = db.Lead;

const addLead = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !phone) {
    throw new ApiError(400, "Fields are Missing");
  }

  // 1. Try to find the lead by email, or create a new one
  const [lead, created] = await Lead.findOrCreate({
    where: { email: email },
    defaults: {
      name,
      phone,
      subject: subject || "",
      message: message || "",
      orgId: req.organization?.id,
      confidence_score: 10 // Initial baseline score
    },
  });

  // 2. If lead ALREADY existed, append the new subject and message
  if (!created) {
    const newSubject = subject ? ` | [New Subject] ${subject}` : "";
    const newMessage = message ? `\n[New Inquiry]: ${message}` : "";

    await lead.update({
      // Uses Postgres concatenation to preserve old data
      subject: db.sequelize.literal(`COALESCE(subject, '') || ${db.sequelize.escape(newSubject)}`),
      message: db.sequelize.literal(`COALESCE(message, '') || ${db.sequelize.escape(newMessage)}`),
      // Optionally boost score for returning interest
      confidence_score: (lead.confidence_score || 0) + 5 
    });
    
    // Reload to get the updated values for the response
    await lead.reload();
  }

  const statusMessage = created 
    ? "Thank you for filling the form. We will get back to you soon." 
    : "We've received your additional information. Talk to you soon!";

  res.json(new ApiResponse(200, lead, statusMessage));
});

const scoreLead = asyncHandler(async( req ,res) => {
  
  const leads = await Lead.findAll({limit : 7});

  if(!leads || leads.length === 0){
    throw new ApiError(404 , "No Leads Found")
  }
  const results = await getLeadAnalysis(leads)

  if(!results){
    throw new ApiError(404 , "Error in getting analysis from leads")
  }
 
  res.json(new ApiResponse(200 , results , "Lead Score"))

})

const getAllLeads = asyncHandler(async(req,res) => {

  const leads = await Lead.findAll();

  if(!leads || leads.length === 0){
    throw new ApiError(404 , "No Leads Found")
  }

  res.json(new ApiResponse(200 , leads , "All Leads Data"))
})

module.exports = { addLead , scoreLead , getAllLeads};
