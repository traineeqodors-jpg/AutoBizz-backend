const { validate } = require("uuid");
const db = require("../../db/models");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const OrganizationDetails = db.OrganizationDetail;
const Organization = db.Organization;

const getOrganizationDetails = asyncHandler(async (req, res) => {
  const orgId = req.user?.orgId || req.user?.id;

  if (!orgId) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const company = await Organization.findOne({
    where: {
      id: orgId,
    },
    attributes: ["businessName", "businessSize", "country"],
  });

  const details = await OrganizationDetails.findOne({
    where: { orgId },
  });

  if (!company || !details) {
    throw new ApiError(404, "Organization details not found");
  }

  const companyData = company.get({ plain: true });
  const detailsData = details.get({ plain: true });

  const responseData = {
    ...detailsData,
    ...companyData,
  };

  return res.json(
    new ApiResponse(
      200,
      responseData,
      "Organization details retrieved successfully",
    ),
  );
});

const addOrganizationDetails = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  if (!id) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const { orgCategory, description, startedInYear } = req.body;

  const existingDetails = await OrganizationDetails.findOne({
    where: { orgId: id },
  });
  if (existingDetails) {
    throw new ApiError(
      400,
      "Details already exist for this organization. Use edit instead.",
    );
  }

  const details = await OrganizationDetails.create({
    orgId: id,
    orgCategory,
    description,
    startedInYear: Number(startedInYear),
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, details, "Organization details added successfully"),
    );
});

const editOrganizationDetails = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  if (!id) {
    throw new ApiError(401, "Unauthorized: Organization ID missing");
  }

  const { orgCategory, description, startedInYear } = req.body;

  const details = await OrganizationDetails.findOne({ where: { orgId: id } });

  if (!details) {
    const detail = await OrganizationDetails.create({
      orgId: id,
      orgCategory: orgCategory || "",
      description: description || "",
      startedInYear: Number(startedInYear) || new Date().getFullYear(),
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, detail, "Organization details added successfully"),
      );
  }

  const updatedDetails = await details.update(
    {
      orgCategory: orgCategory || details.orgCategory,
      description: description,
      startedInYear: Number(startedInYear) || Number(details.startedInYear),
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
