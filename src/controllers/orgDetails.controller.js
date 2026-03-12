const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const OrganizationDetails = db.OrganizationDetail;

const getOrganizationDetails = asyncHandler(async (req, res) => {
  const id = req?.organization?.id;
  if (!id) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const details = await OrganizationDetails.findOne({
    where: {
      orgId: id,
    },
  });

  return res.json(new ApiResponse(200, details, "Organizatio Details"));
});

// Add Organization Details
const addOrganizationDetails = asyncHandler(async (req, res) => {
  const id = req?.organization?.id;
  if (!id) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const { orgCategory, description, startedInYear, sop } = req.body;

  const existingDetails = await OrganizationDetails.findOne({
    where: { orgId: id },
  });
  if (existingDetails) {
    throw new ApiError(
      400,
      "Details already exist for this organization. Use edit instead.",
    );
  }

  // 2. Create new details
  const details = await OrganizationDetails.create({
    orgId: id,
    orgCategory,
    description,
    startedInYear: Number(startedInYear),
    sop,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, details, "Organization details added successfully"),
    );
});

const editOrganizationDetails = asyncHandler(async (req, res) => {
  const id = req?.organization?.id;
  if (!id) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const { orgCategory, description, startedInYear, sop } = req.body;

  // 1. Find the existing record
  const details = await OrganizationDetails.findOne({ where: { orgId: id } });

  if (!details) {
    const detail = await OrganizationDetails.create({
      orgId: id,
      orgCategory: orgCategory || "",
      description: description || "",
      startedInYear: Number(startedInYear) || new Date().getFullYear(),
      sop,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, detail, "Organization details added successfully"),
      );
  }

  // 2. Update the fields
  const updatedDetails = await details.update(
    {
      orgCategory: orgCategory || details.orgCategory,
      description: description,
      startedInYear: Number(startedInYear) || Number(details.startedInYear),
      sop: sop || details.sop,
    },
    { validate: false },
  );

  return res.json(
    new ApiResponse(
      200,
      updatedDetails,
      "Organization details updated successfully",
    ),
  );
});

module.exports = {
  addOrganizationDetails,
  getOrganizationDetails,
  editOrganizationDetails,
};
