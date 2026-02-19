const crypto = require('crypto');

// Simple CSRF protection middleware
function csrfProtection(req, res, next) {
  if (!req.session) {
    return next(new Error('Session required for CSRF protection'));
  }

  // Generate CSRF token if not exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Add method to get CSRF token
  req.csrfToken = () => req.session.csrfToken;

  // Skip verification for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Verify CSRF token for other methods
  const token = req.headers['csrf-token'] || req.body._csrf || req.query._csrf;
  
  if (!token || token !== req.session.csrfToken) {
    const err = new Error('Invalid CSRF token');
    err.code = 'EBADCSRFTOKEN';
    return next(err);
  }

  next();
}

module.exports = csrfProtection;
