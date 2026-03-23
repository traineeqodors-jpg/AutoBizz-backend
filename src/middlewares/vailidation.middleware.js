const { ApiError } = require("../utils/ApiError");
const { query, validationResult } = require("express-validator");

const validate = (schema) => async (req, res, next) => {
  try {

    if (!req.body) {
      throw new ApiError(400, "Request Body is Empty");
    }

    const parsedBody = await schema.parseAsync(req.body);
    req.body = parsedBody;
    next();
  } catch (error) {

  

    console.log(error.issues[0]);
    throw new ApiError(403, error.issues[0].message);
  }
};





const validateLeadsQuery = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("status").optional().isString().trim(),
  query("minScore").optional().isInt({ min: 0 }).withMessage("minScore must be a positive integer"),
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid date (YYYY-MM-DD)"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid date (YYYY-MM-DD)"),
  query("sortBy").optional().isIn(["createdAt", "confidence_score", "name", "email", "company"]).withMessage("Invalid sort field"),
  query("order").optional().isIn(["ASC", "DESC", "asc", "desc"]).withMessage("Order must be ASC or DESC"),

  // Middleware to catch errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }
    next();
  },
];

module.exports = {validate , validateLeadsQuery};
