const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const {
  accesTokenVerification,
  refreshTokenVerfication,
} = require("../services/authService");

const verifyJWT = (type) => (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  const refreshToken = req.cookies?.refreshToken;
  const reqKey = type === "employee" ? "employee" : "organization";

  if (!accessToken && !refreshToken) {
    return next(new ApiError(401, "No tokens found"));
  }

  (async () => {
    try {
      if (accessToken) {
        const user = await accesTokenVerification(accessToken, type);
        req[reqKey] = user;
        return next();
      }

      if (refreshToken) {
        const user = await refreshTokenVerfication(
          refreshToken,
          type,
          req,
          res,
        );
        req[reqKey] = user;
        return next();
      }
    } catch (error) {
      next(error);
    }
  })();
};

const allowOwnerOrEmployee = (req, res, next) => {
  verifyJWT("organization")(req, res, (err) => {
    if (!err) return next();

    verifyJWT("employee")(req, res, (err) => {
      if (!err) return next();

      next(
        new ApiError(
          401,
          "Access denied. Please login as an Owner or Employee.",
        ),
      );
    });
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (req.organization) {
      return next();
    }

    if (req.employee) {
      if (roles.includes(req.employee.role)) {
        return next();
      }
      throw new ApiError(
        403,
        `Access denied: Role '${req.employee.role}' is not authorized.`,
      );
    }

    throw new ApiError(401, "Authentication required");
  };
};

module.exports = { verifyJWT, allowOwnerOrEmployee, authorizeRoles };
