const crypto = require('crypto');

// CSRF protection middleware with token regeneration on auth changes
function csrfProtection(req, res, next) {
  if (!req.session) {
    return next(new Error('Session required for CSRF protection'));
  }

  // Initialize CSRF secret if not exists
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(32).toString('hex');
  }

  // Generate token from secret for this session
  // Token is deterministic for the session but changes when session changes
  const sessionToken = crypto.createHmac('sha256', req.session.csrfSecret)
    .update(req.session.id || 'default')
    .digest('hex');
  
  // Add method to get CSRF token
  req.csrfToken = () => sessionToken;

  // Skip verification for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Verify CSRF token for other methods
  const token = req.headers['csrf-token'] || req.body._csrf || req.query._csrf;
  
  if (!token) {
    const err = new Error('Invalid CSRF token');
    err.code = 'EBADCSRFTOKEN';
    return next(err);
  }

  // Use timing-safe comparison
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(sessionToken);
  
  if (tokenBuffer.length !== expectedBuffer.length || 
      !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    const err = new Error('Invalid CSRF token');
    err.code = 'EBADCSRFTOKEN';
    return next(err);
  }

  next();
}

module.exports = csrfProtection;
