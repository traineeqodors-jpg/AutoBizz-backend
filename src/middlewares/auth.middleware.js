const jwt = require("jsonwebtoken");

const { ApiError } = require("../utils/ApiError");

const db = require("../../db/models");

const verifyJWT = async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  const refreshToken = req.cookies?.refreshToken;

  const token = accessToken || refreshToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = jwt.verify(
      token,

      accessToken
        ? process.env.ACCESS_TOKEN_SECRET
        : process.env.REFRESH_TOKEN_SECRET,
    );

    console.log(decoded);

    const Model = decoded.type === "employee" ? db.Employee : db.Organization;

    let user = await Model.findByPk(decoded.id);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // If refresh token, validate & reissue access token

    if (refreshToken && !accessToken) {
      if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Invalid refresh token");
      }

      const newAccessToken = user.generateAccessToken();

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    // Attach unified user object
    const cleanUser = user.toJSON();

    delete cleanUser.password;
    delete cleanUser.refreshToken;
    delete cleanUser.createdAt;
    delete cleanUser.updatedAt;

    req.user = {
      ...cleanUser,
      type: decoded.type,
    };

    next();
  } catch (err) {
    next(new ApiError(401, err.message || "Invalid token"));
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Organization always allowed (owner)

    if (req.user.type === "organization") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,

        `Access denied: role '${req.user.role}' not allowed`,
      );
    }

    next();
  };
};

module.exports = { verifyJWT, authorizeRoles };
