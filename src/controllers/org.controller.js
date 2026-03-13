"use strict";
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { comparePassword } = require("../utils/authHelper");
const jwt = require("jsonwebtoken");
const path = require("path");

const Organization = db.Organization;

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

const generateAccessToken = async (id) => {
  try {
    const org = await Organization.findByPk(id);

    const accessToken = org.generateAccessToken();
    return { accessToken };
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Something went wrong while generating  access token!",
    );
  }
};

// Register
const registerOrg = asyncHandler(async (req, res) => {
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

  const userExists = await Organization.findOne({ where: { email } });

  if (userExists) {
    throw new ApiError(400, "User Already Exists");
  }

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
    throw new ApiError(400, "Cant Create Org");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    data.id,
  );

  const loggedInUser = data.toJSON();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };

  res
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: 60 * 1000 * 60 * 24,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(201)
    .json(new ApiResponse(201, data, "Org registered Successfully"));
});

// login
const orgLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email or password is missing!");
  }

  const org = await Organization.findOne({
    where: {
      email: email,
    },
  });

  if (!org) {
    throw new ApiError(404, "Email not registered!");
  }

  const isPasswordValid = await comparePassword(password, org.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or Password!");
  }

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

  // 1. Prepare Update Data
  const updateData = {
    firstName,
    lastName,
    email,
    country,
    businessName,
    businessSize,
    phoneNumber,
  };

  // 3. Handle Profile Image Upload & Cleanup
  if (req.file) {
    // If an old image exists, delete it from the 'public' folder
    if (org.profileImage) {
      // Remove the leading slash if it exists to avoid root path issues
      const relativePath = org.profileImage.startsWith("/")
        ? org.profileImage.slice(1)
        : org.profileImage;

      const oldPath = path.join(process.cwd(), relativePath);

      try {
        await fs.unlink(oldPath);
      } catch (err) {
        // Log if file doesn't exist, but don't stop the update
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

const orgLogout = asyncHandler(async (req, res, next) => {
  const options = {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    path: "/",
  };

  const org = await Organization.findByPk(req.organization?.id);
  await org.update({ refreshToken: null });

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  return res.json(new ApiResponse(200, {}, "Organizaion Logout SucessFully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.body?.refreshToken || req.cookies?.refreshToken;
  console.log(req.cookies?.refreshToken);
  console.log(incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  console.log(decodedToken);

  const org = await Organization.findByPk(decodedToken?.id);

  if (!org) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== org?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken } = await generateAccessToken(org.id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

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

const getAllOrgs = asyncHandler(async (req, res) => {
  const data = await Organization.findAll();
  if (!data) {
    throw new ApiError(400, "No Org Data Found");
  }

  res.status(201).json(new ApiResponse(200, data, "Org data"));
});

const me = asyncHandler(async (req, res) => {
  return res.json(
    new ApiResponse(200, req.organization, "Organizaion Details"),
  );
});

module.exports = {
  registerOrg,
  getAllOrgs,
  orgLogin,
  refreshAccessToken,
  orgLogout,
  getCurrentOrgDetails,
  editOrg,
  me,
};
