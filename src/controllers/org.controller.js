"use strict";
const db = require("../../db/models");
const { oauth2Client } = require("../services/googleCalender.services");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { comparePassword } = require("../utils/authHelper");
const jwt = require("jsonwebtoken");
const path = require("path");

const Organization = db.Organization;

// Genrate Access and refresh Token Function
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
  // Req.body Validation
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

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
  const userExists = await Organization.findOne({ where: { email } });

  if (userExists) {
    throw new ApiError(400, "User Already Exists");
  }

  // Inserting Org Data in DB
  const data = await Organization.create({
    firstName,
    lastName,
    email,
    country,
    password,
    businessName: orgName,
    businessSize: orgSize,
    phoneNumber: phone,
  });

  if (!data) {
    throw new ApiError(400, "Failed to Register");
  }

  // Generating Access and Refresh Token
  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    data.id,
  );

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };

  return res
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: 60 * 1000 * 60 * 24,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(201, data, "Org registered Successfully"));
});

// Login Org
const orgLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation for Empty Data
  if (!email || !password) {
    throw new ApiError(400, "Email or password is missing!");
  }

  // Check if email is Valid
  const org = await Organization.findOne({
    where: {
      email: email,
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
      maxAge: 60 * 1000 * 60 * 24,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken },
        "Organization logged in successfully!",
      ),
    );
});

// Edit Org Details
const editOrg = asyncHandler(async (req, res) => {
  const orgId = req.organization?.id;
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

  // Prepare Update Data
  const updateData = {
    firstName,
    lastName,
    email,
    country,
    businessName,
    businessSize,
    phoneNumber,
  };

  // Handle Profile Image Upload
  if (req.file) {
    // If an old image exists, delete it from the 'public' folder
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

    // Save the new path
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

// Logout Org
const orgLogout = asyncHandler(async (req, res, next) => {
  const org = await Organization.findByPk(req.organization?.id);
  await org.update({ refreshToken: null });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.json(new ApiResponse(200, {}, "Organizaion Logout SucessFully"));
});

// get Extra Org Details
const getCurrentOrgDetails = asyncHandler(async (req, res) => {
  const org = await Organization.findByPk(req.organization?.id);

  if (!org) {
    throw new ApiError(400, "No Such Organization Found");
  }

  const currentOrg = org.toJSON();
  delete currentOrg.password;
  delete currentOrg.refreshToken;

  return res.json(new ApiResponse(200, currentOrg, "Organization Detail"));
});

// Handle Google Login
const handleGoogleToken = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const { id: orgId, email: currentEmail } = req.organization;

  if (!code) {
    throw new ApiError(400, "Auth code is required");
  }

  // 1. Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);

  // 2. Decode the ID Token to get the Payload
  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const googleEmail = payload.email;

  // 3. Compare Google Email with App Login Email
  if (googleEmail !== currentEmail) {
    throw new ApiError(400, `Please choose your registered email`);
  }

  // 4. Update the Database with the Refresh Token
  if (tokens.refresh_token) {
    await Organization.update(
      { googleRefreshToken: tokens.refresh_token },
      { where: { id: orgId } },
    );
  }

  // Set credentials for immediate use if needed
  oauth2Client.setCredentials(tokens);

  return res.json(
    new ApiResponse(200, {}, "Google account Connected Successfully!!"),
  );
});

const me = asyncHandler(async (req, res) => {
  return res.json(
    new ApiResponse(200, req.organization, "Organizaion Details"),
  );
});

module.exports = {
  registerOrg,
  orgLogin,
  orgLogout,
  getCurrentOrgDetails,
  editOrg,
  me,
  handleGoogleToken,
};
