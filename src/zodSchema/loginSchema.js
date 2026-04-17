const z = require("zod");

const loginSchema = z.object({
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
    .min(7, "Password must be at least 7 characters long")
    .max(100, "Password too long"),
});

module.exports = loginSchema;
