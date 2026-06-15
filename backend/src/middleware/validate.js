import { AppError } from '../lib/errors.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body ?? {},
    query: req.query ?? {},
    params: req.params ?? {},
  });

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join(', ');
    return next(new AppError(400, issues));
  }

  req.validated = result.data;
  return next();
};
