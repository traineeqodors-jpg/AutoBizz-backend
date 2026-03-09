"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const { comparePassword } = require("../utils/authHelper");
const PasswordReset = db.PasswordReset;
const Organization = db.Organization;


const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const org = await Organization.findOne({ where: { email } });
  if (!org) {
    throw new ApiError(401, "Organization Not Found");
  }

   await PasswordReset.destroy({ where: { orgId: org.id } });

  const token = crypto.randomBytes(32).toString("hex");

  const expiresIn = new Date(Date.now() + 3600000);

  await PasswordReset.create({
    token,
    orgId: org.id,
    expiresIn,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetUrl = `http://192.168.0.37:5173/resetpassword/${token}`;
  await transporter.sendMail({
    to: email,
    subject: "Password Reset Request",
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Valid for 1 hour.</p>`,
  });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Link to reset Password SuccessFully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const resetRecord = await PasswordReset.findOne({
    where: {
      token,
      expiresIn: { [Op.gt]: new Date() }, // Must be greater than current time
    },
  });

  if (!resetRecord) {
    throw new ApiError(400, "Invalid Token or Expired");
  }

  
  

  // 3. Update the Organization's password
 const org = await Organization.findByPk(resetRecord.orgId);

 if(!org){
  throw new ApiError(400 , "Organization Not Found")
 }

 const isValidNewPassword = await comparePassword(newPassword , org.password)
 if(isValidNewPassword){
  throw new ApiError(400 , "Please Enter New Password rather than old one")
 }


 //Checking Password Validation
 const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
 if(!passwordRegex.test(newPassword)){
   throw new ApiError(400 ,"Password must be at least 8 characters long and include one number and one special character");
 }
 

org.password = newPassword;
await org.save({validate : false}); 
  

  // 4. Delete the token record after successful reset
  await resetRecord.destroy();

  res.status(200).json({ message: "Password reset successful." });
});


module.exports = { forgotPassword , resetPassword}