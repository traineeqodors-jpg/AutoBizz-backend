const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const Organization = db.Organization
const Employee = db.Employee




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

const logout = asyncHandler(async (req, res) => {

  const user = req.organization || req.employee;
  const Model = req.organization ? Organization : Employee;

  if (user?.id) {
   
    await Model.update(
      { refreshToken: null },
      { where: { id: user.id }, hooks: false },
    );
  }

  
   const options = {
     httpOnly: true,
     secure: false,
     maxAge: 7 * 24 * 60 * 60 * 1000,
     sameSite: "lax",
     path: "/",
   };

  
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        `${req.organization ? "Organization" : "Employee"} logged out successfully`,
      ),
    );
});




module.exports = { me , logout }