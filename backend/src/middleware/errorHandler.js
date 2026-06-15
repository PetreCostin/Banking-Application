export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const response = {
    error: error.message || 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
