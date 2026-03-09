"use strict";

const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { comparePassword } = require("../utils/authHelper");
const jwt = require("jsonwebtoken");

const Tenant = db.Tenant

const generateAccessRefreshToken = async (id) => {
  try {
    const tenant = await Tenant.findByPk(id);

    const accessToken = tenant.generateAccessToken();
    const refreshToken = tenant.generateRefreshToken();

    await tenant.update({ refreshToken: refreshToken });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token!",
    );
  }
};


const registerTenant = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    password,
  } = req.body;

  const tenantExists = await Tenant.findOne({ where: { email : email } });

  if (tenantExists) {
    throw new ApiError(400, "Tenant Already Exists");
  }

  const data = await Tenant.create({
    firstName,
    lastName,
    email,
    password,
    phoneNumber: phone,
  });

  if (!data) {
    throw new ApiError(400, "Cant Create tenant");
  }

  res
    .status(201)
    .json(new ApiResponse(201, data, "Tenant registered Successfully"));
});


const tenantLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email or password is missing!");
  }

  const tenant = await Tenant.findOne({
    where: {
      email: email,
    },
  });

  if (!tenant) {
    throw new ApiError(404, "Email not registered!");
  }

  const isPasswordValid = await comparePassword(password, tenant.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or Password!");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    tenant.id,
  );

  const loggedInUser = tenant.toJSON();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        loggedInUser,
        "Tenant logged in successfully!",
      ),
    );
});

const editTenant = asyncHandler(async (req, res) => {

 

  const tenant = await Tenant.findByPk(req.tenant?.id);

  
   
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    password,
  } = req.body;

  await tenant.update({
    firstName,
    lastName,
    email,
    phoneNumber: phone,
    password,
  });

  const updateTenant = tenant.toJSON();
  delete updateTenant.password;
  delete updateTenant.refreshToken;

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateTenant, "Tenant updated successfully"),
    );
});

const tenantLogout = asyncHandler(async (req, res, next) => {
  console.log(req.tenant);
  const options = {
    httpOnly: true,
    secure: true,
  };

  const tenant = await Tenant.findByPk(req.tenant?.id);
  await tenant.update({ refreshToken: null });

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  return res.json(new ApiResponse(200, {}, "Tenant Logout SucessFully"));
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

  const tenant = await Tenant.findByPk(decodedToken?.id);

  if (!tenant) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== tenant?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    tenant.id,
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed",
      ),
    );
});

const getCurrentTenantDetails = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByPk(req.tenant?.id);

  if (!tenant) {
    throw new ApiError(400, "No Such Tenant Found");
  }

  const currentTenanat = tenant.toJSON();
  delete currentTenanat.password;
  delete currentTenanat.refreshToken;

  return res.json(new ApiResponse(200, currentTenanat, "Tenant Detail"));
});


module.exports = {
    registerTenant , tenantLogin , editTenant , refreshAccessToken , getCurrentTenantDetails , tenantLogout
}