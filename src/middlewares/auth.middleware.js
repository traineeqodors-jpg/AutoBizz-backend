const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const db = require("../../db/models");
const {
  accesTokenVerification,
  refreshTokenVerfication,
} = require("../services/authService");
const Tenant = db.Tenant;
 
const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
 
  const refreshToken = req.cookies?.refreshToken;
 
  req.organization = null;
 

  if (!accessToken && !refreshToken) {

    throw new ApiError(401, "Bearer token is Required");
  }
 

  if (accessToken) {
    const org = await accesTokenVerification(accessToken);
 
    req.organization = org;
 
    return next();
  }
 
 
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
 

 
module.exports = { verifyJWT, roleMiddleware };
 