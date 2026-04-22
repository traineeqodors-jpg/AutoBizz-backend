const z = require("zod");

const contactUsSchema = z.object({
  name: z
    .string()
    .min(1, "Name is Required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is Required")
    .email("Enter a valid email address")
    .max(255, "Email too long"),

  phone: z
    .string()
    .min(1, "Phone number is Required")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),

  subject: z
    .string()
    .min(1, "Subject is Required")
    .min(3, "Subject must be at least 3 characters")
    .max(100, "Subject is too long"),

  message: z
    .string()
    .min(1, "Message is Required")
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message is too long"),
});

module.exports = contactUsSchema;
