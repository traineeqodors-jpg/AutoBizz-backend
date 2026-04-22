const z = require("zod");

const loginSchema = z.object({
  email: z
    .string({
      error: (issue) => issue.input === undefined && "Email is Required",
    })
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is Required" })
    .email({ message: "Enter a valid Email address" })
    .max(255, { message: "Email too long" }),

  password: z
    .string({
      error: (issue) => issue.input === undefined && "Password is Required",
    })
    .trim()
    .min(1, { message: "Password is Required!" })
    .min(7, { message: "Password must be at least 7 characters long" })
    .max(100, { message: "Password too long" }),
});

module.exports = loginSchema;
