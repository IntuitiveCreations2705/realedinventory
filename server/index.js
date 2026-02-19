require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { initializeDatabase, userOps, inventoryOps, activityOps } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Create default admin user if none exists
async function createDefaultAdmin() {
  try {
    const adminUser = userOps.findByUsername.get(process.env.DEFAULT_ADMIN_USERNAME || 'admin');
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
      userOps.create.run(
        process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        hashedPassword,
        'admin'
      );
      console.log('Default admin user created. Please change the password!');
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
}

createDefaultAdmin();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CSRF protection
const csrfProtection = csrf({ cookie: true });

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// Login endpoint
app.post('/api/login', csrfProtection, [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  
  try {
    const user = userOps.findByUsername.get(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    activityOps.log.run(user.id, 'login', null, `User logged in`);

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
  const userId = req.session.userId;
  activityOps.log.run(userId, 'logout', null, 'User logged out');
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/user', requireAuth, (req, res) => {
  res.json({
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role
  });
});

// Get CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Inventory endpoints
app.get('/api/inventory', requireAuth, (req, res) => {
  try {
    const items = inventoryOps.getAll.all();
    res.json(items);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.get('/api/inventory/low-stock', requireAuth, (req, res) => {
  try {
    const items = inventoryOps.getLowStock.all();
    res.json(items);
  } catch (err) {
    console.error('Error fetching low stock items:', err);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

app.get('/api/inventory/search', requireAuth, (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    const searchTerm = `%${q}%`;
    const items = inventoryOps.search.all(searchTerm, searchTerm, searchTerm);
    res.json(items);
  } catch (err) {
    console.error('Error searching inventory:', err);
    res.status(500).json({ error: 'Failed to search inventory' });
  }
});

app.post('/api/inventory', requireAuth, csrfProtection, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('min_stock').optional().isInt({ min: 0 }).withMessage('Min stock must be a non-negative number')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, quantity, unit, min_stock, location, category } = req.body;
    
    const result = inventoryOps.create.run(
      name,
      description || '',
      quantity,
      unit || 'units',
      min_stock || 10,
      location || '',
      category || ''
    );

    activityOps.log.run(
      req.session.userId,
      'create_item',
      result.lastInsertRowid,
      `Created item: ${name}`
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

app.put('/api/inventory/:id', requireAuth, csrfProtection, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('min_stock').optional().isInt({ min: 0 }).withMessage('Min stock must be a non-negative number')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, description, quantity, unit, min_stock, location, category } = req.body;

    inventoryOps.update.run(
      name,
      description || '',
      quantity,
      unit || 'units',
      min_stock || 10,
      location || '',
      category || '',
      id
    );

    activityOps.log.run(
      req.session.userId,
      'update_item',
      id,
      `Updated item: ${name}`
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

app.delete('/api/inventory/:id', requireAuth, csrfProtection, (req, res) => {
  try {
    const { id } = req.params;
    const item = inventoryOps.findById.get(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    inventoryOps.delete.run(id);

    activityOps.log.run(
      req.session.userId,
      'delete_item',
      id,
      `Deleted item: ${item.name}`
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Activity log endpoint
app.get('/api/activity', requireAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = activityOps.getRecent.all(limit);
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activity log:', err);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ error: 'Invalid CSRF token' });
  } else {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Real Ed Inventory Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});
