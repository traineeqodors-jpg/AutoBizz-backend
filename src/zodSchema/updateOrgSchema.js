const z = require("zod");

const updateOrgSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is Required!" })
    .min(2, { message: "First name must be at least 2 characters long!" })
    .max(50, { message: "First name must be at most 50 characters long!" })
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is Required!" })
    .min(2, { message: "Last name must be at least 2 characters long!" })
    .max(50, { message: "Last name must be at most 50 characters long!" })
    .optional(),

  businessName: z
    .string()
    .trim()
    .min(1, { message: "Organization name is Required" })
    .min(2, {
      message: "Organization name must be at least 2 characters long!",
    })
    .max(100, {
      message: "Organization name must be at most 100 characters long!",
    })
    .optional(),

  businessSize: z
    .string()
    .trim()
    .min(1, { message: "Organization size is Required" })
    .optional(),
});

module.exports = { updateOrgSchema };
