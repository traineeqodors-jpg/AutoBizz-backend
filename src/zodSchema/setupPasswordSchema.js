const z = require("zod");

const setupPasswordSchema = z
  .object({
    email: z
      .string({
        error: (issue) => issue.input === undefined && "Email is Required",
      })
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(255, "Email too long"),

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

    confirmPassword: z
      .string({
        error: (issue) =>
          issue.input === undefined && "Confirm Password is Required",
      })
      .trim()
      .min(7, {
        message: "Confirm Password must be at least 7 characters long!",
      })
      .max(100, {
        message: "Confirm Password must be at most 100 characters long!",
      }),
  })

  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

module.exports = setupPasswordSchema;
