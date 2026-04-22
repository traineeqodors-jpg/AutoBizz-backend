"use strict";
const Api = require("twilio/lib/rest/Api");
const db = require("../../db/models");
const { oauth2Client } = require("../services/googleCalender.services");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { comparePassword } = require("../utils/authHelper");
const jwt = require("jsonwebtoken");
const path = require("path");
const { sendQueryMail } = require("../services/emailServices");

const Organization = db.Organization;
const Employee = db.Employee;
const { Op } = require("sequelize");

const generateAccessRefreshToken = async (id) => {
  try {
    const org = await Organization.findByPk(id);

    const accessToken = org.generateAccessToken();
    const refreshToken = org.generateRefreshToken();

    await org.update({ refreshToken: refreshToken });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token!",
    );
  }
};

// Register Org
const registerOrg = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    country,
    orgName,
    orgSize,
    phone,
    password,
  } = req.body;

  // Check if Email already Exists
  const userExists = await Organization.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (userExists) {
    throw new ApiError(400, "User Already Exists");
  }

  let data = null;

  try {
    // Inserting Org Data in DB
    data = await Organization.create({
      firstName,
      lastName,
      email,
      country,
      password,
      businessName: orgName,
      businessSize: orgSize,
      phoneNumber: phone.replace(/\s/g, ""),
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ApiError(400, "Email already exists");
    }
    throw error;
  }

  if (!data) {
    throw new ApiError(400, "Failed to Register");
  }

  // Generating Access and Refresh Token
  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    data.id,
  );

  const user = data.toJSON();
  delete user.password;
  delete user.refreshToken;
  delete user.googleRefreshToken;

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };

  return res
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: 1000 * 60 * 60 * 24,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    .json(new ApiResponse(201, data, "Org registered Successfully"));
});

// Login Org
const orgLogin = asyncHandler(async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { email, password } = req.body;

  // Check if email is Valid
  const org = await Organization.findOne({
    where: {
      email: email.toLowerCase().trim(),
    },
  });

  if (!org) {
    throw new ApiError(404, "Email not registered!");
  }

  // Checking if password is correct
  const isPasswordValid = await comparePassword(password, org.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or Password!");
  }

  // Generating Access and Refresh Token
  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    org.id,
  );

  const loggedInUser = org.toJSON();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };

  return res
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: 1000 * 60 * 60 * 24,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken },
        "Organization logged in successfully!",
      ),
    );
});

// Edit Organization Details
const editOrg = asyncHandler(async (req, res) => {
  const orgId = req.user?.orgId || req.user?.id;
  const org = await Organization.findByPk(orgId);

  if (!org) {
    throw new ApiError(404, "Organization not found");
  }

  const {
    firstName,
    lastName,
    email,
    country,
    businessName,
    businessSize,
    phoneNumber,
  } = req.body;

  const updateData = {
    firstName,
    lastName,
    email,
    country,
    businessName,
    businessSize,
    phoneNumber,
  };

  if (req.file) {
    if (org.profileImage) {
      const relativePath = org.profileImage.startsWith("/")
        ? org.profileImage.slice(1)
        : org.profileImage;

      const oldPath = path.join(process.cwd(), relativePath);

      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.error("Old profile image not found on disk:", oldPath);
      }
    }

    updateData.profileImage = `/public/${req.file.filename}`;
  }

  await org.update(updateData);

  const updatedOrg = org.toJSON();
  delete updatedOrg.password;
  delete updatedOrg.refreshToken;

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedOrg, "Organization updated successfully"),
    );
});

// Handle Google Login
const handleGoogleToken = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const { id: orgId, email: currentEmail } = req.user;

  if (!code) {
    throw new ApiError(400, "Auth code is required");
  }

  const { tokens } = await oauth2Client.getToken(code);

  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const googleEmail = payload.email;

  if (googleEmail !== currentEmail) {
    throw new ApiError(400, `Please choose your registered email`);
  }

  if (tokens.refresh_token) {
    await Organization.update(
      { googleRefreshToken: tokens.refresh_token },
      { where: { id: orgId } },
    );

    await db.Employee.update(
      { googleRefreshToken: tokens.refresh_token },
      {
        where: {
          orgId: orgId,
          role: "sales",
        },
      },
    );
  }

  oauth2Client.setCredentials(tokens);

  return res.json(
    new ApiResponse(200, {}, "Google account Connected Successfully!!"),
  );
});

// Contact Us
const queryForm = asyncHandler(async (req, res) => {
  const { name, email, subject, message, phone } = req.body;

  const to = "trainee.qodors@gmail.com";

  const response = await sendQueryMail(to, {
    name,
    email,
    subject,
    message,
    phone,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Query submitted and email sent successfully"),
    );
});

// Get all Employees Data
const getAllEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, isVerified } = req.query;

  const offset = (page - 1) * limit;

  const hasFilters = !!(search || role || isVerified);

  const whereCondition = {
    orgId: req.user?.id,
  };

  if (search) {
    whereCondition[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (role) {
    whereCondition.role = role;
  }

  if (isVerified !== undefined) {
    whereCondition.isVerified = isVerified === "true";
  }

  const { count, rows: employees } = await Employee.findAndCountAll({
    where: whereCondition,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
    attributes: { exclude: ["password", "refreshToken", "googleRefreshToken"] },
  });

  res.json(
    new ApiResponse(
      200,
      {
        employees,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
        hasFilters,
      },
      "Employee Details Fetched",
    ),
  );
});

// Update Employee data
const updateEmployee = asyncHandler(async (req, res) => {
  const { firstName, lastName, phoneNumber, role, isVerified, id } = req.body;

  const employee = await Employee.findOne({
    where: {
      id,
      orgId: req.user?.id,
    },
  });

  if (!employee) {
    throw new ApiError(404, "Employee not found or access denied");
  }

  await employee.update({
    firstName: firstName || employee.firstName,
    lastName: lastName || employee.lastName,
    phoneNumber: phoneNumber || employee.phoneNumber,
    role: role || employee.role,
    isVerified: isVerified !== undefined ? isVerified : employee.isVerified,
  });

  res.json(new ApiResponse(200, employee, "Employee updated successfully"));
});

// Delete Employee
const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) throw new ApiError(400, "Please pass id to delete Employee!");

  const deletedCount = await Employee.destroy({
    where: {
      id,
      orgId: req.user?.id,
    },
  });

  if (deletedCount === 0) {
    throw new ApiError(
      404,
      "Employee not found or you don't have permission to delete",
    );
  }

  res.json(new ApiResponse(200, {}, "Employee deleted successfully"));
});

module.exports = {
  registerOrg,
  orgLogin,
  editOrg,
  handleGoogleToken,
  queryForm,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
};
