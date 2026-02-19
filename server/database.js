const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/inventory.db';
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'units',
      min_stock INTEGER DEFAULT 10,
      location TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      item_id INTEGER,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);
    CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp);
  `);
}

// Initialize the database first
initializeDatabase();

// User operations - prepared after initialization
const userOps = {
  create: db.prepare(`
    INSERT INTO users (username, password_hash, role)
    VALUES (?, ?, ?)
  `),
  
  findByUsername: db.prepare(`
    SELECT * FROM users WHERE username = ?
  `),
  
  getAll: db.prepare(`
    SELECT id, username, role, created_at FROM users
  `)
};

// Inventory operations
const inventoryOps = {
  create: db.prepare(`
    INSERT INTO inventory_items (name, description, quantity, unit, min_stock, location, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  
  update: db.prepare(`
    UPDATE inventory_items 
    SET name = ?, description = ?, quantity = ?, unit = ?, min_stock = ?, location = ?, category = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  delete: db.prepare(`
    DELETE FROM inventory_items WHERE id = ?
  `),
  
  findById: db.prepare(`
    SELECT * FROM inventory_items WHERE id = ?
  `),
  
  getAll: db.prepare(`
    SELECT * FROM inventory_items ORDER BY name ASC
  `),
  
  getLowStock: db.prepare(`
    SELECT * FROM inventory_items WHERE quantity <= min_stock ORDER BY quantity ASC
  `),
  
  search: db.prepare(`
    SELECT * FROM inventory_items 
    WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
    ORDER BY name ASC
  `)
};

// Activity log operations
const activityOps = {
  log: db.prepare(`
    INSERT INTO activity_log (user_id, action, item_id, details)
    VALUES (?, ?, ?, ?)
  `),
  
  getRecent: db.prepare(`
    SELECT a.*, u.username, i.name as item_name
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN inventory_items i ON a.item_id = i.id
    ORDER BY a.timestamp DESC
    LIMIT ?
  `)
};

module.exports = {
  db,
  userOps,
  inventoryOps,
  activityOps
};
