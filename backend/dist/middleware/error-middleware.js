export const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    console.error(`Error ${statusCode}: ${message}`);
    console.error(error.stack);
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(statusCode).json({
        error: message,
        ...(isDevelopment && { stack: error.stack })
    });
};
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
};
export const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
//# sourceMappingURL=error-middleware.js.map