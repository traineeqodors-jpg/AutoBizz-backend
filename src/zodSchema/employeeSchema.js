const z = require("zod");

const employeeSchema = z.object({
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
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),

  email: z
    .string({
      error: (issue) => issue.input === undefined && "Email is Required",
    })
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is Required" })
    .email({ message: "Enter a valid Email address" })
    .max(255, { message: "Email must be at most 255 characters long!" }),

  role: z.enum(["sales", "employee"], {
    errorMap: () => ({ message: "Role must be either 'sales' or 'employee'" }),
  }),
});

module.exports = employeeSchema;
