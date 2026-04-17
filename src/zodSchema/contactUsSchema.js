const z = require("zod");

const contactUsSchema = z.object({
  name: z
    .string({
      error: (issue) => issue.input === undefined && "Name is Required",
    })
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  email: z
    .string({
      error: (issue) => issue.input === undefined && "Email is Required",
    })
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email too long"),

  phone: z
    .string({
      error: (issue) => issue.input === undefined && "Phone is Required",
    })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),

  subject: z
    .string({
      error: (issue) => issue.input === undefined && "Subject is Required",
    })
    .min(3, "Subject must be at least 3 characters")
    .max(100, "Subject is too long"),

  message: z
    .string({
      error: (issue) => issue.input === undefined && "Message is Required",
    })
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message is too long"),
});

module.exports = contactUsSchema;
