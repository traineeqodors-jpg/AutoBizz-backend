const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { accesTokenVerification, refreshTokenVerfication } = require("../services/authService");

const verifyJWT = (type) => async (req, res, next) => {
  const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    return next(new ApiError(401, "No tokens found"));
  }

  try {
    
    const decoded = jwt.decode(accessToken || refreshToken);
    
    if (!decoded || decoded.type !== type) {
      throw new ApiError(403, `Access denied: Expected ${type} token, but got ${decoded?.type || "none"}`);
    }

    const reqKey = type === "employee" ? "employee" : "organization";

    // 2. Proceed with full verification (DB check + Secret check)
    if (accessToken) {
      const user = await accesTokenVerification(accessToken, type);
      req[reqKey] = user;
      req[reqKey].type = reqKey;
      
      return next();
    }

    if (refreshToken) {
      const user = await refreshTokenVerfication(refreshToken, type, req, res);
      req[reqKey] = user;
      req[reqKey].type = reqKey;
      return next();
    }
  } catch (error) {
    next(error);
  }
};

const allowOwnerOrEmployee = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  const refreshToken = req.cookies?.refreshToken;
  const token = accessToken || refreshToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
   
    const decoded = jwt.decode(token);
    const userType = decoded?.type;

    if (userType !== "organization" && userType !== "employee") {
      throw new ApiError(403, "Invalid token type. Access denied.");
    }

    
    return verifyJWT(userType)(req, res, next);
  } catch (error) {
    next(error);
  }
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
