
/**
 * Backend Error Handling Middleware
 * Centralized error handling for Cloud Functions
 */

const admin = require('firebase-admin');
const ErrorAggregator = require('./error_aggregator');

class ErrorMiddleware {
  static errorAggregator = new ErrorAggregator();

  // Wrap Cloud Function with error handling
  static wrapFunction(functionHandler) {
    return async (req, res) => {
      try {
        await functionHandler(req, res);
      } catch (error) {
        await this.handleError(error, req, res);
      }
    };
  }

  // Handle errors
  static async handleError(error, req, res) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      type: 'function_error',
      functionName: req.url || 'unknown',
      method: req.method,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.uid || null
    };

    // Log error
    console.error('Function error:', errorData);

    // Collect error for analysis
    await this.errorAggregator.collectError(errorData);

    // Send appropriate response
    if (!res.headersSent) {
      const statusCode = error.statusCode || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;

      res.status(statusCode).json({
        error: message,
        timestamp: errorData.timestamp
      });
    }
  }

  // Validation error handler
  static handleValidationError(validationResult, res) {
    if (!validationResult.isEmpty()) {
      const errors = validationResult.array();
      const errorData = {
        type: 'validation_error',
        errors: errors,
        timestamp: new Date().toISOString()
      };

      this.errorAggregator.collectError(errorData);

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
  }

  // Authentication error handler
  static handleAuthError(error, res) {
    const errorData = {
      type: 'auth_error',
      message: error.message,
      timestamp: new Date().toISOString()
    };

    this.errorAggregator.collectError(errorData);

    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

module.exports = ErrorMiddleware;
