const { ApiError } = require("../utils/ApiError");

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

module.exports = validate;
