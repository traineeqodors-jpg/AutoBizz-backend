const { z } = require("zod");

const phoneRegex = /^\+[1-9]\d{8,14}$/;

const leadSchema = z.object({
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Name is Required"
          : "Name must be a string",
    })
    .trim()
    .min(2, { message: "Name must be at least 2 characters long!" })
    .max(50, { message: "Name must be at most 50 characters long!" }),

  email: z
    .string({
      error: (issue) => issue.input === undefined && "Email is Required",
    })
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is Required" })
    .email({ message: "Enter a valid Email address" })
    .max(255, { message: "Email must be at most 255 characters long!" }),

  phone: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Phone Number is Required"
          : "Phone Number must be a string",
    })
    .trim()
    .min(1, { message: "Phone number is Required" })
    .min(8, "Phone number is too short")
    .max(15, "Phone number is too long")
    .regex(phoneRegex, "Phone must include country code (e.g., +919876543210)"),

  companyName: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Company name is Required"
          : "Company name must be a string",
    })
    .trim()
    .min(2, { message: "Company name must be at least 2 characters long!" })
    .max(50, { message: "Company name must be at most 50 characters long!" }),
});

module.exports = { leadSchema };
