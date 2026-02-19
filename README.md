# 🏢 Real Ed Inventory

A simple, automated, and secure inventory management system designed for very novice operators. Perfect for small businesses, schools, warehouses, or any organization that needs to track inventory without complexity.

## ✨ Features

### For Novice Operators
- **Simple Interface**: Clean, easy-to-use web interface with clear labels and buttons
- **Guided Setup**: Interactive setup wizard to configure the system
- **Clear Error Messages**: User-friendly error messages that explain what went wrong
- **No Technical Knowledge Required**: Everything works through a simple web browser

### Automation
- **Auto-Backup**: Automatic daily database backups (configurable)
- **Low Stock Alerts**: Visual warnings when items are running low
- **Activity Logging**: Automatic tracking of all changes
- **Auto-Refresh**: Real-time updates of low stock alerts

### Security
- **User Authentication**: Secure login system with password hashing
- **Session Management**: Secure user sessions
- **CSRF Protection**: Protection against cross-site request forgery attacks
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Protection**: Prepared statements prevent SQL injection

## 🚀 Quick Start

### Prerequisites
- Node.js version 16 or higher ([Download here](https://nodejs.org/))

### Installation

1. **Clone or download this repository**
   ```bash
   cd realedinventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the setup wizard** (recommended for first-time setup)
   ```bash
   npm run setup
   ```
   
   Or copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your web browser**
   
   Navigate to: `http://localhost:3000`

6. **Login with default credentials**
   - Username: `admin`
   - Password: `admin123`
   
   ⚠️ **IMPORTANT**: Change this password immediately after first login!

## 📖 User Guide

### First Time Setup

1. After starting the application, open your web browser and go to `http://localhost:3000`
2. You'll see a login screen
3. Enter the default username and password (see above)
4. You're now in the inventory management system!

### Adding Items to Inventory

1. Click the green **"+ Add Item"** button
2. Fill in the item details:
   - **Name**: The name of the item (required)
   - **Description**: What the item is or any notes
   - **Quantity**: How many you have (required)
   - **Unit**: What you're counting (e.g., "boxes", "kg", "units")
   - **Minimum Stock Level**: When to show a low stock warning
   - **Location**: Where the item is stored
   - **Category**: Type or category of item
3. Click **"Save"**

### Viewing Inventory

- All your items are shown in a table on the main screen
- Items with low stock have a yellow "Low Stock" badge
- Items with sufficient stock have a green "OK" badge
- A warning banner appears at the top when any items are low on stock

### Editing Items

1. Find the item in the table
2. Click the blue **"Edit"** button
3. Change the details you want to update
4. Click **"Save"**

### Deleting Items

1. Find the item in the table
2. Click the red **"Delete"** button
3. Confirm that you want to delete the item

### Searching

- Use the search box at the top to find items
- You can search by name, description, or category
- Results update automatically as you type

### Refreshing the View

- Click the **"🔄 Refresh"** button to reload the inventory
- This also updates low stock alerts

## 🔒 Security Best Practices

1. **Change Default Password**: After first login, update the admin password
2. **Use Strong Passwords**: Use passwords with letters, numbers, and symbols
3. **Keep Session Secret Safe**: Never share your SESSION_SECRET from the .env file
4. **Regular Backups**: Enable automatic backups (enabled by default)
5. **Update Regularly**: Keep Node.js and dependencies updated

## 🛠️ Configuration

### Environment Variables

Edit the `.env` file to configure the application:

```env
# Server Settings
PORT=3000                    # Port number for the web server
NODE_ENV=production          # production or development

# Security
SESSION_SECRET=your-secret   # Keep this secret and random!

# Database
DB_PATH=./data/inventory.db  # Where to store the database

# Backups
BACKUP_ENABLED=true          # Enable/disable automatic backups
BACKUP_INTERVAL=86400000     # Backup interval (24 hours in milliseconds)
BACKUP_DIR=./backups         # Where to store backups

# Alerts
LOW_STOCK_THRESHOLD=10       # Show alert when quantity ≤ this number

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # Time window for rate limiting (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window

# Default Admin
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

## 💾 Backup and Restore

### Automatic Backups

Backups are created automatically based on your configuration (default: daily).
Backups are stored in the `./backups` directory.

### Manual Backup

To create a backup immediately:
```bash
npm run backup
```

### Restoring from Backup

1. Stop the application
2. Find the backup file in the `./backups` directory
3. Copy the backup file to replace the current database:
   ```bash
   cp ./backups/inventory-backup-YYYY-MM-DD.db ./data/inventory.db
   ```
4. Start the application again

## 🐛 Troubleshooting

### Can't Login

- Check that you're using the correct username and password
- Default is `admin` / `admin123`
- Check the `.env` file for configured credentials

### Can't Access the Website

- Make sure the server is running (you should see "Real Ed Inventory Server running...")
- Check the port number in the `.env` file
- Make sure no other application is using the same port
- Try `http://localhost:3000` in your browser

### Database Errors

- Make sure the `./data` directory exists and is writable
- Check file permissions
- Try restoring from a backup if available

### Items Not Showing Up

- Click the "🔄 Refresh" button
- Check the search box - clear it if there's any text
- Check the browser console for errors (F12)

## 📊 Features for Different User Levels

### Basic Users Can:
- View all inventory items
- Add new items
- Edit existing items
- Delete items
- Search for items
- See low stock alerts

### Administrators Can:
- Everything basic users can do
- Access to all system features
- View activity logs (future feature)

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
npm update
```

### Checking for Issues

```bash
npm audit
```

### Fixing Security Issues

```bash
npm audit fix
```

## 📝 Support

If you encounter issues:

1. Check this README's troubleshooting section
2. Check the console output for error messages
3. Review the `.env` configuration
4. Try restarting the application

## 📄 License

MIT License - feel free to use and modify as needed.

## 🎯 Development

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

This requires `nodemon` which is included in dev dependencies.

### Project Structure

```
realedinventory/
├── server/
│   ├── index.js           # Main server file
│   └── database.js        # Database operations
├── public/
│   ├── index.html         # Web interface
│   └── app.js             # Frontend JavaScript
├── scripts/
│   ├── setup.js           # Setup wizard
│   └── backup.js          # Backup utility
├── data/                  # Database storage (created automatically)
├── backups/               # Backup storage (created automatically)
├── package.json           # Dependencies and scripts
├── .env                   # Configuration (create from .env.example)
└── README.md              # This file
```

## 🌟 Tips for Novice Operators

1. **Start Simple**: Add a few test items first to get familiar with the system
2. **Use Categories**: Organize items with categories (e.g., "Office Supplies", "Electronics")
3. **Set Locations**: Use the location field to remember where items are stored
4. **Regular Updates**: Update quantities regularly to keep track of stock
5. **Check Alerts**: Pay attention to the low stock warning banner
6. **Backup Often**: Keep backups of your database, especially before major changes

## ✅ Safety Features

- **Can't delete by accident**: Deletion requires confirmation
- **Activity logging**: All actions are logged for audit trail  
- **Data validation**: System prevents invalid data entry
- **Automatic saves**: Changes are saved immediately
- **Session timeout**: Automatic logout after inactivity for security
