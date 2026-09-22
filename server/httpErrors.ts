import type { ErrorRequestHandler } from 'express';
export const publicErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error?.fields) {
    res.status(400).json({ error: Object.values(error.fields)[0], fields: error.fields });
    return;
  }
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Please provide valid JSON.' });
    return;
  }
  if (error?.code === '23514' || error?.code === '22P02' || error?.code === '22003') {
    res.status(400).json({ error: 'Please check the supplied values.' });
    return;
  }
  if (error?.code === '23505') {
    res.status(409).json({ error: 'An account or record with these details already exists.' });
    return;
  }
  if (error?.code === '23503') {
    res.status(400).json({ error: 'A selected record is no longer available. Please refresh.' });
    return;
  }
  const status =
    Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599
      ? error.status
      : 500;
  res
    .status(status)
    .json({
      error: status < 500 ? error.message : 'Unable to complete the request. Please try again.',
    });
};
