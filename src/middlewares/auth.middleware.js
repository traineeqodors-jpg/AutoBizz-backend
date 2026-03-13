const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const db = require("../../db/models");
const {
  accesTokenVerification,
  refreshTokenVerfication,
} = require("../services/authService");
const Organization = db.Organization;
const Tenant = db.Tenant;

const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  const refreshToken = req.cookies?.refreshToken;

  req.organization = null;

  // if don't have any Cookie Send Error
  if (!accessToken && !refreshToken) {
    // return res.status(200).json();
    throw new ApiError(401, "Bearer token is Required");
  }

  // If have Access Token
  if (accessToken) {
    const org = await accesTokenVerification(accessToken);

    req.organization = org;

    return next();
  }

  // If Refresh Token Available then create Access Token
  if (refreshToken) {
    const org = await refreshTokenVerfication(refreshToken, req, res);

    req.organization = org;

    return next();
  }
});

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.organization.role)) {
    return res.json({ message: "Acccess Denied Insufficent Permission" });
  }
  next();
};

const verifyTenant = asyncHandler(async (req, res, next) => {
  const bearerToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!bearerToken) {
    throw new ApiError(401, "Bearer token is Required");
  }

  const decodedToken = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);

  if (!decodedToken) {
    throw new ApiError(401, "Invalid or Expired Token");
  }

  const tenant = await Tenant.findByPk(decodedToken?.id, {
    attributes: {
      exclude: ["password", "refreshToken"],
    },
  });

  if (!tenant) {
    throw new ApiError(401, "Invalid Access Token");
  }

  req.tenant = tenant;
  req.tenant.type = decodedToken?.type;

  next();
});

module.exports = { verifyJWT, roleMiddleware, verifyTenant };
