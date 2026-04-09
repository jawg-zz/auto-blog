import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details || err.message
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Resource not found'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};
