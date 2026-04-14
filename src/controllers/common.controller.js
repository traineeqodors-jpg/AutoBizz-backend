const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");




const me = asyncHandler(async (req, res) => {
 
  const user = req.organization || req.employee;
  const userType = req.organization ? "Organization" : "Employee";

  if (!user) {
    throw new ApiError(401, "User details not found");
  }

  return res.json(
    new ApiResponse(200, user, `${userType} Details`)
  );
});

module.exports = { me }