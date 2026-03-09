const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];
    console.log(err)

    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = err.errors[0]?.message || "Duplicate field value entered";
        errors = err.errors.map(e => e.message);
    } 
    
  
    else if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = "Validation Failed";
        errors = err.errors.map(e => e.message);
    }

   
    else if (err.name === 'SequelizeDatabaseError') {
        statusCode = 500;
        message = "Invalid database operation";
    }

  
    const finalStatusCode = Number.isInteger(statusCode) ? statusCode : 500;

    console.log(`[DEBUG] Caught Error - Status: ${finalStatusCode}, Type: ${err.name}`);

    res.status(finalStatusCode).json({
        success: false,
        message: message,
        errors: errors,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

module.exports = errorHandler;
