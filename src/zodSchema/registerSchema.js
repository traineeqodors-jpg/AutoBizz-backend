const z = require("zod");

const registerSchema = z.object({
  firstName: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "First name is Required"
          : "First Name must be a string",
    })
    .trim()
    .min(2, { message: "First name must be at least 2 characters long!" })
    .max(50, { message: "First name must be at most 50 characters long!" }),

  lastName: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Last name is Required"
          : "Last Name must be a string",
    })
    .trim()
    .min(2, { message: "Last name must be at least 2 characters long!" })
    .max(50, { message: "Last name must be at most 50 characters long!" }),

  orgName: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Organization name is Required"
          : "Organization Name must be a string",
    })
    .trim()
    .min(1, { message: "Organization name is Required" })
    .min(2, {
      message: "Organization name must be at least 2 characters long!",
    })
    .max(100, {
      message: "Organization name must be at most 100 characters long!",
    }),

  orgSize: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Organization Size is Required"
          : "Organization Size must be a string",
    })
    .trim()
    .min(1, { message: "Organization size is Required" }),

  country: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Country is Required"
          : "Country must be a string",
    })
    .trim()
    .min(1, { message: "Country is Required" }),

  phone: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Phone Number is Required"
          : "Phone Number must be a string",
    })
    .trim()
    .min(1, { message: "Phone number is Required" })
    .min(10, { message: "Phone number must be at least 10 digits long!" })
    .regex(/^\+[0-9]{1,4}-[0-9]{10,15}$/, {
      message: "Invalid phone format (e.g. +91-9876543210)",
    }),

  email: z
    .string({
      error: (issue) => issue.input === undefined && "Email is Required",
    })
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is Required" })
    .email({ message: "Enter a valid Email address" })
    .max(255, { message: "Email must be at most 255 characters long!" }),

  password: z
    .string({
      error: (issue) => issue.input === undefined && "Password is Required",
    })
    .trim()
    .min(7, { message: "Password must be at least 7 characters long!" })
    .max(100, { message: "Password must be at most 100 characters long!" })
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*_\-])[a-zA-Z0-9!@#$%^&*_\-]{7,}$/, {
      message:
        "Password must contain at least one number and one special character",
    }),
});

module.exports = registerSchema;
