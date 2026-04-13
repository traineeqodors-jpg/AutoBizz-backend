const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const db = require("../../db/models");

const verifyJWT = (token, secret) => {
  return jwt.verify(token, secret);
};

const accesTokenVerification = async (accessToken, type) => {
  try {
    const decodedToken = verifyJWT(accessToken, process.env.ACCESS_TOKEN_SECRET);
    

    const Model = type === "employee" ? db.Employee : db.Organization;

    const user = await Model.findByPk(decodedToken?.id, {
      attributes: { exclude: ["password", "refreshToken"] },
      raw: true,
    });

    if (!user) throw new ApiError(401, `Invalid ${type} Access Token`);

    return user;
  } catch (error) {
    throw new ApiError(401, error?.message || "Token verification failed");
  }
};

const refreshTokenVerfication = async (refreshToken, type, req, res) => {
  try {
    const decodedToken = verifyJWT(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!decodedToken) {
      throw new ApiError(401, "Invalid or Expired Token");
    }

    const Model = type === "employee" ? db.Employee : db.Organization;

    const user = await Model.findByPk(decodedToken?.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, `Invalid ${type} Refresh Token`);
    }

    const accessToken = user.generateAccessToken();

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      path: "/",
    };

    res.cookie("accessToken", accessToken, {
      ...options,
      maxAge: 60 * 1000 * 60 * 24,
    });

    return user;
  } catch (error) {
    throw new ApiError(401, "Session expired, please login again");
  }
};

module.exports = { accesTokenVerification, refreshTokenVerfication };