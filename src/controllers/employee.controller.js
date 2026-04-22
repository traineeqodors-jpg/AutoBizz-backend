const db = require("../../db/models");
const Employee = db.Employee;
const crypto = require("crypto");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendInvitationEmail } = require("../services/emailServices");

const createEmployee = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, role } = req.body;

  const existedEmployee = await Employee.findOne({ where: { email } });
  if (existedEmployee) {
    throw new ApiError(409, "Employee with this email already exists");
  }

  const setupToken = crypto.randomBytes(32).toString("hex");
  const tempPassword = crypto.randomBytes(12).toString("hex") + "1!Aa";

  let employee = null;

  if (role === "sales") {
    employee = await Employee.create({
      firstName,
      lastName,
      email,
      phoneNumber: phone,
      role,
      orgId: req.user?.id,
      password: tempPassword,
      refreshToken: setupToken,
      googleRefreshToken: req.user?.googleRefreshToken,
    });
  } else {
    employee = await Employee.create({
      firstName,
      lastName,
      email,
      phoneNumber: phone,
      role,
      orgId: req.user?.id,
      password: tempPassword,
      refreshToken: setupToken,
    });
  }

  const setupUrl = `${process.env.FRONTEND_URL}/setup-password?token=${setupToken}&email=${email}`;

  try {
    await sendInvitationEmail(email, firstName, setupUrl);
  } catch (err) {
    console.error("Email failed to send:", err);
  }

  const employeeData = employee.toJSON();

  delete employeeData.password;
  delete employeeData.refreshToken;
  delete employeeData.googleRefreshToken;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        employeeData,
        "Employee created and invitation sent successfully",
      ),
    );
});

const setupEmployeePassword = asyncHandler(async (req, res) => {
  const { token, email, password, confirmPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const employee = await Employee.findOne({
    where: { email, refreshToken: token },
  });

  if (!employee) {
    throw new ApiError(400, "Invalid or expired setup token");
  }

  employee.password = password;
  employee.refreshToken = null;
  employee.isVerified = true;
  await employee.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password updated successfully. You can now login.",
      ),
    );
});

const loginEmployee = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request Body is Empty");
  }

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const employee = await Employee.findOne({ where: { email } });

  if (!employee) {
    throw new ApiError(404, "Employee with this email doesn't exist");
  }

  if (!employee.isVerified) {
    throw new ApiError(
      401,
      "Account not activated. Please set your password via email first.",
    );
  }

  const isPasswordValid = await employee.validPassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = employee.generateAccessToken();
  const refreshToken = employee.generateRefreshToken();

  employee.refreshToken = refreshToken;
  await employee.save({ hooks: false });

  const loggedInEmployee = employee.toJSON();
  delete loggedInEmployee.password;
  delete loggedInEmployee.refreshToken;

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { employee: loggedInEmployee, accessToken, refreshToken },
        "Employee logged in successfully",
      ),
    );
});

module.exports = {
  createEmployee,
  setupEmployeePassword,
  loginEmployee,
};
