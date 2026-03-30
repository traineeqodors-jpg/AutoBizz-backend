const jwt = require("jsonwebtoken");
 
const { ApiError } = require("../utils/ApiError");
 
const db = require("../../db/models");
const Organization = db.Organization;
 

const verifyJWT = (token, secret) => {
  return jwt.verify(token, secret);
};
 

const accesTokenVerification = async (accessToken) => {
  try {

    const decodedToken = verifyJWT(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );

    const org = await Organization.findByPk(decodedToken?.id, {
      attributes: { exclude: ["password", "refreshToken"] },
      raw: true,
    });
 
    if (!org) throw new ApiError(401, "Invalid Access Token");
 
    return org;
  } catch (error) {
    throw new ApiError(401, error?.message || "Token verification failed");
  }
};
 

const refreshTokenVerfication = async (refreshToken, req, res) => {
  try {
 
    const decodedToken = verifyJWT(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
 
    if (!decodedToken) {
      throw new ApiError(401, "Invalid or Expired Token");
    }
 

    const org = await Organization.findByPk(decodedToken?.id, {
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    });
 
    if (!org) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
 
    const accessToken = org.generateAccessToken();
 
    const options = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    };
 
    
    res.cookie("accessToken", accessToken, {
      ...options,
      maxAge: 60 * 1000 * 60 * 24,
    });
 
    return org;
  } catch (error) {
    console.log("Refresh token invalid:", error);
  }
};
 
module.exports = { accesTokenVerification, refreshTokenVerfication };
 