require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🏢 Real Ed Inventory - Setup Wizard\n');
  console.log('This wizard will help you configure your inventory system.\n');

  const envPath = path.join(__dirname, '..', '.env');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n--- Server Configuration ---');
  const port = await question('Server port (default: 3000): ') || '3000';
  const nodeEnv = await question('Environment (production/development, default: production): ') || 'production';

  console.log('\n--- Security Configuration ---');
  console.log('Generating a random session secret...');
  const sessionSecret = require('crypto').randomBytes(32).toString('hex');

  console.log('\n--- Database Configuration ---');
  const dbPath = await question('Database path (default: ./data/inventory.db): ') || './data/inventory.db';

  console.log('\n--- Backup Configuration ---');
  const backupEnabled = await question('Enable automatic backups? (y/n, default: y): ') || 'y';
  const backupInterval = await question('Backup interval in hours (default: 24): ') || '24';
  const backupDir = await question('Backup directory (default: ./backups): ') || './backups';

  console.log('\n--- Inventory Settings ---');
  const lowStockThreshold = await question('Low stock alert threshold (default: 10): ') || '10';

  console.log('\n--- Default Admin User ---');
  const adminUsername = await question('Admin username (default: admin): ') || 'admin';
  const adminPassword = await question('Admin password (default: admin123): ') || 'admin123';

  console.log('\n--- Rate Limiting ---');
  const rateLimitWindow = await question('Rate limit window in minutes (default: 15): ') || '15';
  const rateLimitMax = await question('Max requests per window (default: 100): ') || '100';

  const envContent = `# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}

# Session Secret (Keep this secret!)
SESSION_SECRET=${sessionSecret}

# Database
DB_PATH=${dbPath}

# Backup Configuration
BACKUP_ENABLED=${backupEnabled === 'y' ? 'true' : 'false'}
BACKUP_INTERVAL=${parseInt(backupInterval) * 3600000}
BACKUP_DIR=${backupDir}

# Low Stock Alert Threshold
LOW_STOCK_THRESHOLD=${lowStockThreshold}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=${parseInt(rateLimitWindow) * 60000}
RATE_LIMIT_MAX_REQUESTS=${rateLimitMax}

# Default Admin User (will be created on first run)
DEFAULT_ADMIN_USERNAME=${adminUsername}
DEFAULT_ADMIN_PASSWORD=${adminPassword}
`;

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration saved to .env');
  console.log('\n📝 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start the server: npm start');
  console.log('3. Access the application at http://localhost:' + port);
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');

  rl.close();
}

setup().catch(err => {
  console.error('Setup error:', err);
  rl.close();
  process.exit(1);
});
