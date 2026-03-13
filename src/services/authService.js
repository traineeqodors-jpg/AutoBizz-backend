const jwt = require("jsonwebtoken");

const { ApiError } = require("../utils/ApiError");

const db = require("../../db/models");
const Organization = db.Organization;

// verify Jwt
const verifyJWT = (token, secret) => {
  return jwt.verify(token, secret);
};

// verify AccessToken
const accesTokenVerification = async (accessToken) => {
  try {
    // Decode and verify JWT Token
    const decodedToken = verifyJWT(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );

    // Find Org By Id
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

// Verify and Generate Refresh Token
const refreshTokenVerfication = async (refreshToken, req, res) => {
  try {
    // Decode Token
    const decodedToken = verifyJWT(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // If Invalid Token
    if (!decodedToken) {
      throw new ApiError(401, "Invalid or Expired Token");
    }

    // Find Org to Set In Request Object
    const org = await Organization.findByPk(decodedToken?.id, {
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    });

    if (!org) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    // Generate Access Token
    const accessToken = org.generateAccessToken();

    const options = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    };

    // Sending Cookie
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
