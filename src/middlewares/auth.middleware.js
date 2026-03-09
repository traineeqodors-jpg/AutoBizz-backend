const jwt = require("jsonwebtoken");
const {ApiError} = require("../utils/ApiError");
const {asyncHandler} = require("../utils/asyncHandler");
const db = require("../../db/models");
const Organization = db.Organization;
const Tenant = db.Tenant
 
const verifyJWT = asyncHandler(async (req, res, next) => {
 


    
    const bearerToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
 
    if (!bearerToken) {
       throw new ApiError(401, "Bearer token is Required" );
    }
 
    
 
    const decodedToken = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);
 
    if (!decodedToken) {
       throw new ApiError(401, "Invalid or Expired Token");
    }
 
    const org = await Organization.findByPk(decodedToken?.id, {
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    });

    
 
    if (!org) {
      throw new ApiError(401, "Invalid Access Token");
    }
 
    req.organization = org;
 
    next();
  
});

const roleMiddleware = (roles) => (req,res,next) => {
    if(!roles.includes(req.organization.role)){
        return res.json({message : "Acccess Denied Insufficent Permission"})
    }
    next();
}


const verifyTenant = asyncHandler(async (req,res,next) => {

    const bearerToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
 
    if (!bearerToken) {
       throw new ApiError(401, "Bearer token is Required" );
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
    req.tenant.type = decodedToken?.type
    
 
    next();

})
 
module.exports = {verifyJWT , roleMiddleware , verifyTenant};