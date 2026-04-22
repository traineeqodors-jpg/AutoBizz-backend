"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { comparePassword } = require("../utils/authHelper");
const { sendResetPasswordLink } = require("../services/emailServices");
const PasswordReset = db.PasswordReset;
const Organization = db.Organization;
const Employee = db.Employee;

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const org = await Organization.findOne({
    where: { email: email.toLowerCase().trim() },
  });

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

  await sendResetPasswordLink(token, org.email, org.firstName);

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
      expiresIn: { [Op.gt]: new Date() },
    },
  });

  if (!resetRecord) {
    throw new ApiError(400, "Invalid Token or Expired");
  }

  const org = await Organization.findByPk(resetRecord.orgId);

  if (!org) {
    throw new ApiError(400, "Organization Not Found");
  }

  const isValidNewPassword = await comparePassword(newPassword, org.password);
  if (isValidNewPassword) {
    throw new ApiError(400, "Please Enter New Password rather than old one");
  }

  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*_\-])[a-zA-Z0-9!@#$%^&*_\-]{7,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new ApiError(
      400,
      "Password must be at least 7 characters long and include one number and one special character",
    );
  }

  org.password = newPassword;
  await org.save({ validate: false });

  await resetRecord.destroy();

  res.status(200).json({ message: "Password reset successful." });
});

const updatePassword = asyncHandler(async (req, res) => {
  const isOwner = req?.user?.role === "owner";

  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  let user = null;

  console.log(isOwner);

  if (isOwner) {
    user = await Organization.findByPk(req.user?.id);
  } else {
    user = await Employee.findByPk(req.user?.id);
  }

  if (!user) throw new ApiError(400, "User Not Found");

  const isOldValid = await comparePassword(oldPassword, user.password);
  if (!isOldValid) throw new ApiError(400, "Old password is incorrect");

  const isSame = await comparePassword(newPassword, user.password);
  if (isSame)
    throw new ApiError(400, "Please Enter New Password rather than old one");

  user.password = newPassword;
  await user.save({ validate: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password updated successfully"));
});

module.exports = { forgotPassword, resetPassword, updatePassword };
