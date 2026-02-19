require('dotenv').config();
const fs = require('fs');
const path = require('path');

function backup() {
  const dbPath = process.env.DB_PATH || './data/inventory.db';
  const backupDir = process.env.BACKUP_DIR || './backups';
  
  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.log('No database found to backup.');
    return;
  }

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Create backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `inventory-backup-${timestamp}.db`);

  try {
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);

    // Clean up old backups (keep last 30 days)
    cleanOldBackups(backupDir);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}

function cleanOldBackups(backupDir) {
  const files = fs.readdirSync(backupDir);
  const backupFiles = files.filter(f => f.startsWith('inventory-backup-') && f.endsWith('.db'));
  
  // Sort by modification time (oldest first)
  const fileStats = backupFiles.map(f => ({
    name: f,
    path: path.join(backupDir, f),
    time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
  })).sort((a, b) => a.time - b.time);

  // Keep last 30 backups
  const maxBackups = 30;
  if (fileStats.length > maxBackups) {
    const toDelete = fileStats.slice(0, fileStats.length - maxBackups);
    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`Deleted old backup: ${file.name}`);
    });
  }
}

backup();
