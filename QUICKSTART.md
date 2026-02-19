# Quick Start Guide for Real Ed Inventory

## For Very Novice Users

This guide will help you get started with the Real Ed Inventory system in just a few minutes.

### What You Need

- A computer with Node.js installed (version 16 or higher)
  - Don't have Node.js? Download it from: https://nodejs.org/
  - Choose the "LTS" (Long Term Support) version
  - Follow the installer instructions for your operating system

### Step 1: Get the Code

1. Download this project to your computer
2. Extract the ZIP file if you downloaded it as a ZIP
3. Open a terminal or command prompt
   - **Windows**: Press Windows key, type "cmd", press Enter
   - **Mac**: Press Cmd+Space, type "terminal", press Enter
   - **Linux**: Press Ctrl+Alt+T

### Step 2: Navigate to the Project

In the terminal, type these commands (press Enter after each):

```bash
cd path/to/realedinventory
```

Replace `path/to/realedinventory` with the actual location where you extracted the files.

### Step 3: Install Required Software

Type this command and press Enter:

```bash
npm install
```

This will download all the necessary software. It might take a few minutes.

### Step 4: Set Up the System

You have two options:

**Option A - Use the Setup Wizard (Recommended)**
```bash
npm run setup
```

Follow the prompts and answer the questions. Press Enter to use default values.

**Option B - Use the Example Configuration**
```bash
cp .env.example .env
```

On Windows, use this instead:
```cmd
copy .env.example .env
```

### Step 5: Start the Application

Type this command and press Enter:

```bash
npm start
```

You should see:
```
Real Ed Inventory Server running on port 3000
Access the application at http://localhost:3000
```

### Step 6: Open the Application

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. In the address bar, type: `http://localhost:3000`
3. Press Enter

You should see the login screen!

### Step 7: Login

Use these default credentials:

- **Username**: admin
- **Password**: admin123

⚠️ **IMPORTANT**: After you login for the first time, you should change this password!

## Using the System

### Adding Your First Item

1. Click the green **"+ Add Item"** button
2. Fill in the information:
   - **Name**: Give your item a name (required)
   - **Description**: Add any notes about the item
   - **Quantity**: How many you have (required)
   - **Unit**: What you're counting (like "boxes" or "pieces")
   - **Minimum Stock Level**: When you want to be warned it's low
   - **Location**: Where it's stored
   - **Category**: What type of item it is
3. Click **"Save"**

That's it! Your item is now in the inventory.

### Viewing Items

All your items appear in the table on the main screen. You'll see:
- The item name and description
- How many you have
- Where it's located
- A status badge (green = OK, yellow = Low Stock)

### Low Stock Alerts

If any item has a quantity at or below its minimum stock level, you'll see:
- A yellow warning banner at the top of the page
- A list of items that are running low
- A yellow "Low Stock" badge next to those items in the table

### Searching for Items

1. Click in the search box at the top
2. Start typing a name, description, or category
3. Results appear automatically as you type

### Editing an Item

1. Find the item in the table
2. Click the blue **"Edit"** button
3. Make your changes
4. Click **"Save"**

### Deleting an Item

1. Find the item in the table
2. Click the red **"Delete"** button
3. Click **"OK"** to confirm

### Refreshing the List

Click the **"🔄 Refresh"** button to update the inventory and low stock alerts.

### Logging Out

Click the **"Logout"** button in the top right corner when you're done.

## Stopping the Application

To stop the server:

1. Go back to the terminal where the server is running
2. Press **Ctrl+C** on your keyboard
3. The server will stop

You can start it again anytime by running `npm start`

## Automatic Backups

The system automatically backs up your inventory data every 24 hours. You'll find backups in the `backups` folder.

## Need Help?

If something isn't working:

1. Make sure the server is running (`npm start`)
2. Make sure you're using the right web address: `http://localhost:3000`
3. Try refreshing your web browser
4. Check the troubleshooting section in the full README.md

## Security Tips

1. **Change the default password** after first login
2. **Keep backups** of your data (they're in the `backups` folder)
3. **Don't share** your admin password with others
4. If you need to create more users in the future, update the system configuration

## That's All!

You're now ready to manage your inventory. The system is designed to be simple and safe to use, even if you've never used inventory software before.

Happy organizing! 📦
