const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const Organization = db.Organization;
const Employee = db.Employee;

const me = asyncHandler(async (req, res) => {
  const user = req.user;
  const userType = req.user?.type;

  if (!user) {
    throw new ApiError(401, "User details not found");
  }

  return res.json(new ApiResponse(200, user, `${userType} Details`));
});

const logout = asyncHandler(async (req, res) => {
  const isEmp = req.user?.orgId ? true : false;
  const id = req.user?.id;
  const Model = isEmp ? Employee : Organization;

  await Model.update(
    { refreshToken: null },
    { where: { id: id }, hooks: false },
  );

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(
      new ApiResponse(
        200,
        {},
        `${isEmp ? "Employee" : "Organization"} logged out successfully`,
      ),
    );
});
module.exports = { me, logout };
