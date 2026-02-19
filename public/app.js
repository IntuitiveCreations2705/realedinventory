// Global state
let csrfToken = null;
let currentUser = null;
let inventoryData = [];

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const addItemBtn = document.getElementById('addItemBtn');
const refreshBtn = document.getElementById('refreshBtn');
const searchBox = document.getElementById('searchBox');
const itemModal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
const cancelBtn = document.getElementById('cancelBtn');
const inventoryTable = document.getElementById('inventoryTable');
const inventoryBody = document.getElementById('inventoryBody');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');
const alertBanner = document.getElementById('alertBanner');
const lowStockList = document.getElementById('lowStockList');
const modalError = document.getElementById('modalError');
const modalTitle = document.getElementById('modalTitle');

// Initialize app
async function init() {
    try {
        const user = await checkAuth();
        if (user) {
            showMainApp(user);
            await loadInventory();
            checkLowStock();
        } else {
            showLoginScreen();
        }
    } catch (err) {
        showLoginScreen();
    }
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (err) {
        return null;
    }
}

// Get CSRF token
async function getCsrfToken() {
    try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (err) {
        console.error('Error getting CSRF token:', err);
        return null;
    }
}

// Show login screen
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

// Show main app
function showMainApp(user) {
    currentUser = user;
    currentUserSpan.textContent = user.username;
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Get CSRF token first
        await getCsrfToken();

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMainApp(data.user);
            await loadInventory();
            checkLowStock();
            loginForm.reset();
        } else {
            showError(loginError, data.error || 'Login failed');
        }
    } catch (err) {
        showError(loginError, 'An error occurred. Please try again.');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        inventoryData = [];
        showLoginScreen();
    } catch (err) {
        console.error('Logout error:', err);
    }
});

// Load inventory
async function loadInventory() {
    try {
        loadingSpinner.classList.remove('hidden');
        inventoryTable.classList.add('hidden');
        emptyState.classList.add('hidden');

        const response = await fetch('/api/inventory');
        if (!response.ok) throw new Error('Failed to load inventory');

        inventoryData = await response.json();
        
        loadingSpinner.classList.add('hidden');

        if (inventoryData.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            renderInventory(inventoryData);
        }
    } catch (err) {
        console.error('Error loading inventory:', err);
        loadingSpinner.classList.add('hidden');
        alert('Failed to load inventory. Please refresh the page.');
    }
}

// Render inventory table
function renderInventory(items) {
    inventoryBody.innerHTML = '';
    
    if (items.length === 0) {
        inventoryTable.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    inventoryTable.classList.remove('hidden');
    emptyState.classList.add('hidden');

    items.forEach(item => {
        const row = document.createElement('tr');
        
        const isLowStock = item.quantity <= item.min_stock;
        const statusBadge = isLowStock 
            ? '<span class="badge badge-warning">Low Stock</span>'
            : '<span class="badge badge-success">OK</span>';

        row.innerHTML = `
            <td><strong>${escapeHtml(item.name)}</strong></td>
            <td>${escapeHtml(item.description || '')}</td>
            <td>${item.quantity}</td>
            <td>${escapeHtml(item.unit)}</td>
            <td>${escapeHtml(item.location || '-')}</td>
            <td>${escapeHtml(item.category || '-')}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-primary btn-small" onclick="editItem(${item.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;
        
        inventoryBody.appendChild(row);
    });
}

// Check low stock
async function checkLowStock() {
    try {
        const response = await fetch('/api/inventory/low-stock');
        const lowStockItems = await response.json();

        if (lowStockItems.length > 0) {
            lowStockList.innerHTML = '';
            lowStockItems.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.name}: ${item.quantity} ${item.unit} (minimum: ${item.min_stock})`;
                lowStockList.appendChild(li);
            });
            alertBanner.classList.add('show');
        } else {
            alertBanner.classList.remove('show');
        }
    } catch (err) {
        console.error('Error checking low stock:', err);
    }
}

// Search functionality
let searchTimeout;
searchBox.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const query = e.target.value.trim();
        
        if (query === '') {
            renderInventory(inventoryData);
            return;
        }

        try {
            const response = await fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            renderInventory(results);
        } catch (err) {
            console.error('Search error:', err);
        }
    }, 300);
});

// Refresh button
refreshBtn.addEventListener('click', async () => {
    searchBox.value = '';
    await loadInventory();
    checkLowStock();
});

// Add item button
addItemBtn.addEventListener('click', async () => {
    modalTitle.textContent = 'Add Item';
    itemForm.reset();
    document.getElementById('itemId').value = '';
    modalError.classList.add('hidden');
    
    // Get fresh CSRF token
    await getCsrfToken();
    
    itemModal.classList.add('show');
});

// Edit item
window.editItem = async function(id) {
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;

    modalTitle.textContent = 'Edit Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemMinStock').value = item.min_stock;
    document.getElementById('itemLocation').value = item.location || '';
    document.getElementById('itemCategory').value = item.category || '';
    modalError.classList.add('hidden');

    // Get fresh CSRF token
    await getCsrfToken();

    itemModal.classList.add('show');
}

// Delete item
window.deleteItem = async function(id) {
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;

    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
        return;
    }

    try {
        // Get fresh CSRF token
        await getCsrfToken();

        const response = await fetch(`/api/inventory/${id}`, {
            method: 'DELETE',
            headers: {
                'CSRF-Token': csrfToken
            }
        });

        if (response.ok) {
            await loadInventory();
            checkLowStock();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete item');
        }
    } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item. Please try again.');
    }
}

// Save item (add or edit)
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.classList.add('hidden');

    const itemId = document.getElementById('itemId').value;
    const itemData = {
        name: document.getElementById('itemName').value,
        description: document.getElementById('itemDescription').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        unit: document.getElementById('itemUnit').value || 'units',
        min_stock: parseInt(document.getElementById('itemMinStock').value) || 10,
        location: document.getElementById('itemLocation').value,
        category: document.getElementById('itemCategory').value
    };

    try {
        const url = itemId ? `/api/inventory/${itemId}` : '/api/inventory';
        const method = itemId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify(itemData)
        });

        const data = await response.json();

        if (response.ok) {
            itemModal.classList.remove('show');
            itemForm.reset();
            await loadInventory();
            checkLowStock();
        } else {
            if (data.errors) {
                showError(modalError, data.errors.map(e => e.msg).join(', '));
            } else {
                showError(modalError, data.error || 'Failed to save item');
            }
        }
    } catch (err) {
        console.error('Error saving item:', err);
        showError(modalError, 'An error occurred. Please try again.');
    }
});

// Cancel button
cancelBtn.addEventListener('click', () => {
    itemModal.classList.remove('show');
    itemForm.reset();
    modalError.classList.add('hidden');
});

// Close modal on outside click
itemModal.addEventListener('click', (e) => {
    if (e.target === itemModal) {
        itemModal.classList.remove('show');
        itemForm.reset();
        modalError.classList.add('hidden');
    }
});

// Utility functions
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
init();

// Auto-refresh low stock alerts every 5 minutes
setInterval(checkLowStock, 5 * 60 * 1000);
