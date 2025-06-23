// script.js

const API_BASE_URL = 'http://192.168.31.120:3000/api'; // Your backend API base URL

// --- DOM Elements ---
const usernameDesktopSpan = document.getElementById('usernameDesktop');
const usernameMobileSpan = document.getElementById('usernameMobile');
const totalSalesTodayDiv = document.getElementById('totalSalesToday');
const retailSalesTodayDiv = document.getElementById('retailSalesToday');
const wholesaleSalesTodayDiv = document.getElementById('wholesaleSalesToday');
const totalDuesOutstandingDiv = document.getElementById('totalDuesOutstanding');
const totalProductsInStockDiv = document.getElementById('totalProductsInStock');
const topSellingProductTodayDiv = document.getElementById('topSellingProductToday');
const messageBox = document.getElementById('message-box');
const sidebar = document.querySelector('.sidebar');
const menuButton = document.getElementById('menuButton');

// General view management
const viewSections = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.nav-link');

// Add Product Form
const addProductForm = document.getElementById('addProductForm');
const productNameInput = document.getElementById('productName');
const productTypeSelect = document.getElementById('productType');
const costPriceInput = document.getElementById('costPrice');
const retailPriceInput = document.getElementById('retailPrice');
const wholesalePriceInput = document.getElementById('wholesalePrice');
const productQuantityInput = document.getElementById('productQuantity');
const productUnitInput = document.getElementById('productUnit');

// View Products
const productsTableBody = document.querySelector('#productsTable tbody');
const noProductsMessageView = document.getElementById('noProductsMessageView');
const viewProductSearchInput = document.getElementById('viewProductSearch');
const viewProductSuggestionsDiv = document.getElementById('viewProductSuggestions');

// Add Customer Form
const addCustomerForm = document.getElementById('addCustomerForm');
const customerNameInput = document.getElementById('customerName');
const customerMobileInput = document.getElementById('customerMobile');

// View Customers
const customersTableBody = document.querySelector('#customersTable tbody');
const noCustomersMessageView = document.getElementById('noCustomersMessageView');
const viewCustomerSearchInput = document.getElementById('viewCustomerSearch');

// Record Payment
const recordPaymentForm = document.getElementById('recordPaymentForm');
const paymentCustomerSearchInput = document.getElementById('paymentCustomerSearch');
const paymentCustomerSuggestionsDiv = document.getElementById('paymentCustomerSuggestions');
const selectedPaymentCustomerDisplay = document.getElementById('selectedPaymentCustomerDisplay');
const selectedPaymentCustomerIdInput = document.getElementById('selectedPaymentCustomerId');
const amountPaidInput = document.getElementById('amountPaid');
const paymentNoteInput = document.getElementById('paymentNote');
let selectedPaymentCustomer = null; // For record payment customer selection

// View Customer Dues
const customerDuesTableBody = document.querySelector('#customerDuesTable tbody');
const noDuesMessageView = document.getElementById('noDuesMessageView');

// Activity Logs
const activityLogsTableBody = document.querySelector('#activityLogsTable tbody');
const noLogsMessageView = document.getElementById('noLogsMessageView');

// --- Helper Functions ---
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`; // Apply type class
    messageBox.classList.remove('hidden'); // Show message box
    // Animate visibility
    messageBox.style.opacity = '1';
    messageBox.style.transform = 'translateY(0)';

    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            messageBox.classList.add('hidden'); // Hide message box after transition
        }, 300); // Allow time for fade out transition
    }, 5000); // Hide after 5 seconds
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- Authentication & Data Loading ---
async function fetchAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        handleAuthError();
        throw new Error('No authentication token found.');
    }

    options.headers = {
        ...options.headers,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, options);

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            handleAuthError(response);
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

async function handleAuthError(response = null) {
    if (response && (response.status === 401 || response.status === 403)) {
        showMessage('Session expired or unauthorized. Please log in again.', 'error');
    } else {
        showMessage('An unexpected authentication error occurred. Please try again.', 'error');
    }
    localStorage.removeItem('token');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// --- SPA View Management ---
function showView(viewId) {
    viewSections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('animate-fade-in-up'); // Remove animation class
    });

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('animate-fade-in-up'); // Add animation class
    } else {
        console.error(`Attempted to show non-existent view with ID: ${viewId}`);
        showMessage('Requested view not found.', 'error');
        return;
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewId) {
            link.classList.add('active');
        }
    });

    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }

    switch (viewId) {
        case 'dashboardSummaryView':
            loadDashboardSummary();
            break;
        case 'addProductView':
            addProductForm.reset();
            break;
        case 'viewProductsView':
            loadProductsList();
            viewProductSearchInput.value = '';
            viewProductSuggestionsDiv.classList.add('hidden');
            break;
        case 'addCustomerView':
            addCustomerForm.reset();
            break;
        case 'viewCustomersView':
            loadCustomersList();
            viewCustomerSearchInput.value = '';
            break;
        case 'recordPaymentView':
            resetRecordPaymentForm();
            break;
        case 'viewCustomerDuesView':
            loadCustomerDuesList();
            break;
        case 'activityLogsView':
            loadActivityLogsList();
            break;
    }
}

// Add event listeners for sidebar navigation
navLinks.forEach(link => {
    if (link.dataset.view) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showView(link.dataset.view);
        });
    }
});

// --- Dashboard Summary View Logic ---
async function loadDashboardSummary() {
    try {
        const userData = await fetchAuth(`${API_BASE_URL}/users/me`);
        usernameDesktopSpan.textContent = userData.username;
        usernameMobileSpan.textContent = userData.username;

        const summaryData = await fetchAuth(`${API_BASE_URL}/dashboard/summary`);
        totalSalesTodayDiv.textContent = `$${parseFloat(summaryData.totalSalesToday).toFixed(2)}`;
        retailSalesTodayDiv.textContent = `$${parseFloat(summaryData.retailSalesToday).toFixed(2)}`;
        wholesaleSalesTodayDiv.textContent = `$${parseFloat(summaryData.wholesaleSalesToday).toFixed(2)}`;
        totalDuesOutstandingDiv.textContent = `$${parseFloat(summaryData.totalDuesOutstanding).toFixed(2)}`;
        totalProductsInStockDiv.textContent = parseFloat(summaryData.totalProductsInStock).toFixed(2);
        topSellingProductTodayDiv.textContent = summaryData.topSellingProductToday || 'N/A';
    } catch (error) {
        console.error('Error loading dashboard summary:', error.message);
        // Error messages handled by fetchAuth, just log here
    }
}

// --- Add Product View Logic ---
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: productNameInput.value,
        type: productTypeSelect.value,
        cost_price: parseFloat(costPriceInput.value),
        retail_price: parseFloat(retailPriceInput.value),
        wholesale_price: parseFloat(wholesalePriceInput.value),
        quantity: parseFloat(productQuantityInput.value),
        unit: productUnitInput.value
    };

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/products/add`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showMessage(data.message, 'success');
        addProductForm.reset();
        loadDashboardSummary();
    } catch (error) {
        console.error('Error adding product:', error.message);
        showMessage(`Failed to add product: ${error.message}`, 'error');
    }
});

// --- View Products View Logic ---
const fetchProductSuggestionsForView = debounce(async (searchTerm) => {
    viewProductSuggestionsDiv.innerHTML = '';
    if (searchTerm.length > 0 && searchTerm.length < 2) {
         viewProductSuggestionsDiv.classList.add('hidden');
         return;
    }

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/products`, {
            method: 'POST',
            body: JSON.stringify({ name: searchTerm })
        });

        if (data.products && data.products.length > 0) {
            viewProductSuggestionsDiv.classList.remove('hidden');
            data.products.forEach(product => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = `${product.name} (${product.unit})`;
                suggestionItem.onclick = () => {
                    viewProductSearchInput.value = product.name;
                    viewProductSuggestionsDiv.classList.add('hidden');
                    loadProductsList(product.name);
                };
                viewProductSuggestionsDiv.appendChild(suggestionItem);
            });
        } else {
            viewProductSuggestionsDiv.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching product suggestions for view:', error.message);
        showMessage('Failed to fetch product suggestions.', 'error');
    }
}, 300);

viewProductSearchInput.addEventListener('input', (e) => {
    fetchProductSuggestionsForView(e.target.value.trim());
});

viewProductSearchInput.addEventListener('change', () => {
    loadProductsList(viewProductSearchInput.value.trim());
});

document.addEventListener('click', (e) => {
    if (!viewProductSuggestionsDiv.contains(e.target) && e.target !== viewProductSearchInput) {
        viewProductSuggestionsDiv.classList.add('hidden');
    }
});

async function loadProductsList(searchTerm = '') {
    productsTableBody.innerHTML = '';
    noProductsMessageView.classList.add('hidden');

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/products`, {
            method: 'POST',
            body: JSON.stringify({ name: searchTerm })
        });

        if (data.products && data.products.length > 0) {
            data.products.forEach(product => {
                const row = productsTableBody.insertRow();
                row.innerHTML = `
                    <td class="py-3 px-6">${product.id}</td>
                    <td class="py-3 px-6">${product.name}</td>
                    <td class="py-3 px-6">${product.type}</td>
                    <td class="py-3 px-6">$${parseFloat(product.cost_price).toFixed(2)}</td>
                    <td class="py-3 px-6">$${parseFloat(product.retail_price).toFixed(2)}</td>
                    <td class="py-3 px-6">$${parseFloat(product.wholesale_price).toFixed(2)}</td>
                    <td class="py-3 px-6">${parseFloat(product.quantity).toFixed(2)}</td>
                    <td class="py-3 px-6">${product.unit}</td>
                    <td class="py-3 px-6">${new Date(product.created_at).toLocaleDateString()}</td>
                    <td class="py-3 px-6">
                        <button class="text-blue-600 hover:text-blue-900 text-sm font-semibold transition-colors duration-200" onclick="showMessage('Update not implemented!', 'info');">Edit</button>
                    </td>
                `;
            });
        } else {
            noProductsMessageView.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading products list:', error.message);
        showMessage(`Failed to load products: ${error.message}`, 'error');
    }
}

// --- Add Customer View Logic ---
addCustomerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: customerNameInput.value,
        mobile_no: customerMobileInput.value
    };

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/customers/add`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showMessage(data.message, 'success');
        addCustomerForm.reset();
        loadCustomersList();
    } catch (error) {
        console.error('Error adding customer:', error.message);
        showMessage(`Failed to add customer: ${error.message}`, 'error');
    }
});

// --- View Customers View Logic ---
const fetchCustomersForView = debounce(async (searchTerm) => {
    customersTableBody.innerHTML = '';
    noCustomersMessageView.classList.add('hidden');
    if (searchTerm.length > 0 && searchTerm.length < 2) return;

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/customers`, {
            method: 'POST',
            body: JSON.stringify({ name: searchTerm, mobile_no: searchTerm })
        });

        renderCustomersTable(data.customers);
    } catch (error) {
        console.error('Error fetching customers for view:', error.message);
        showMessage('Failed to fetch customers.', 'error');
    }
}, 300);

viewCustomerSearchInput.addEventListener('input', (e) => {
    fetchCustomersForView(e.target.value.trim());
});

async function loadCustomersList(searchTerm = '') {
    customersTableBody.innerHTML = '';
    noCustomersMessageView.classList.add('hidden');
    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/customers`, {
            method: 'POST',
            body: JSON.stringify({ name: searchTerm, mobile_no: searchTerm })
        });
        renderCustomersTable(data.customers);
    } catch (error) {
        console.error('Error loading customers list:', error.message);
        showMessage(`Failed to load customers: ${error.message}`, 'error');
    }
}

function renderCustomersTable(customers) {
    customersTableBody.innerHTML = '';
    if (customers && customers.length > 0) {
        customers.forEach(customer => {
            const row = customersTableBody.insertRow();
            row.innerHTML = `
                <td class="py-3 px-6">${customer.id}</td>
                <td class="py-3 px-6">${customer.name}</td>
                <td class="py-3 px-6">${customer.mobile_no}</td>
                <td class="py-3 px-6">${new Date(customer.created_at).toLocaleDateString()}</td>
                <td class="py-3 px-6">
                    <button class="text-blue-600 hover:text-blue-900 text-sm font-semibold transition-colors duration-200" onclick="showMessage('View customer bills not implemented here!', 'info');">View Bills</button>
                </td>
            `;
        });
    } else {
        noCustomersMessageView.classList.remove('hidden');
    }
}


// --- Record Payment View Logic ---
const fetchPaymentCustomerSuggestions = debounce(async (searchTerm) => {
    paymentCustomerSuggestionsDiv.innerHTML = '';
    if (searchTerm.length < 2) {
        paymentCustomerSuggestionsDiv.classList.add('hidden');
        return;
    }

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/customers`, {
            method: 'POST',
            body: JSON.stringify({ name: searchTerm, mobile_no: searchTerm })
        });

        if (data.customers && data.customers.length > 0) {
            paymentCustomerSuggestionsDiv.classList.remove('hidden');
            data.customers.forEach(customer => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.innerHTML = `<div>${customer.name}</div><div class="text-sm text-gray-500">${customer.mobile_no}</div>`;
                suggestionItem.onclick = () => selectPaymentCustomer(customer);
                paymentCustomerSuggestionsDiv.appendChild(suggestionItem);
            });
        } else {
            paymentCustomerSuggestionsDiv.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching payment customer suggestions:', error.message);
        showMessage('Failed to fetch customer suggestions for payment.', 'error');
    }
}, 300);

paymentCustomerSearchInput.addEventListener('input', (e) => {
    fetchPaymentCustomerSuggestions(e.target.value.trim());
});

document.addEventListener('click', (e) => {
    if (!paymentCustomerSuggestionsDiv.contains(e.target) && e.target !== paymentCustomerSearchInput) {
        paymentCustomerSuggestionsDiv.classList.add('hidden');
    }
});

function selectPaymentCustomer(customer) {
    selectedPaymentCustomer = customer;
    selectedPaymentCustomerIdInput.value = customer.id;
    paymentCustomerSearchInput.value = customer.name;
    selectedPaymentCustomerDisplay.innerHTML = `
        <p class="font-semibold">Selected Customer:</p>
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Mobile:</strong> ${customer.mobile_no}</p>
    `;
    paymentCustomerSuggestionsDiv.classList.add('hidden');
    showMessage(`Selected customer for payment: ${customer.name}`, 'info');
}

recordPaymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedPaymentCustomer || !selectedPaymentCustomer.id) {
        showMessage('Please select a customer for payment.', 'error');
        return;
    }

    const payload = {
        customer_id: selectedPaymentCustomer.id,
        amount_paid: parseFloat(amountPaidInput.value),
        note: paymentNoteInput.value || null
    };

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/transactions/record-payment`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showMessage(data.message, 'success');
        resetRecordPaymentForm();
        loadCustomerDuesList();
    } catch (error) {
        console.error('Error recording payment:', error.message);
        showMessage(`Failed to record payment: ${error.message}`, 'error');
    }
});

function resetRecordPaymentForm() {
    recordPaymentForm.reset();
    selectedPaymentCustomer = null;
    selectedPaymentCustomerIdInput.value = '';
    selectedPaymentCustomerDisplay.textContent = 'No customer selected.';
    paymentCustomerSuggestionsDiv.innerHTML = '';
    paymentCustomerSuggestionsDiv.classList.add('hidden');
}

// --- View Customer Dues View Logic ---
async function loadCustomerDuesList() {
    customerDuesTableBody.innerHTML = '';
    noDuesMessageView.classList.add('hidden');

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/customer-dues`);

        if (data.customerDues && data.customerDues.length > 0) {
            data.customerDues.forEach(due => {
                const row = customerDuesTableBody.insertRow();
                row.innerHTML = `
                    <td class="py-3 px-6">${due.customer_id}</td>
                    <td class="py-3 px-6">${due.customer_name}</td>
                    <td class="py-3 px-6">${due.customer_mobile_no || 'N/A'}</td>
                    <td class="py-3 px-6 text-red-600 font-bold">$${parseFloat(due.total_due).toFixed(2)}</td>
                    <td class="py-3 px-6">${new Date(due.updated_at).toLocaleString()}</td>
                    <td class="py-3 px-6">
                        <button class="text-green-600 hover:text-green-900 text-sm font-semibold transition-colors duration-200" onclick="fillRecordPaymentForm(${due.customer_id}, '${due.customer_name}', '${due.customer_mobile_no}')">Record Payment</button>
                    </td>
                `;
            });
        } else {
            noDuesMessageView.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading customer dues list:', error.message);
        showMessage(`Failed to load customer dues: ${error.message}`, 'error');
    }
}

function fillRecordPaymentForm(customerId, customerName, customerMobile) {
    showView('recordPaymentView');
    selectPaymentCustomer({ id: customerId, name: customerName, mobile_no: customerMobile });
    // Optionally, you might pre-fill amount paid or display current due here
    // amountPaidInput.value = ...
}

// --- Activity Logs View Logic ---
async function loadActivityLogsList() {
    activityLogsTableBody.innerHTML = '';
    noLogsMessageView.classList.add('hidden');

    try {
        const data = await fetchAuth(`${API_BASE_URL}/dashboard/activity-logs`);

        if (data.activityLogs && data.activityLogs.length > 0) {
            data.activityLogs.forEach(log => {
                const row = activityLogsTableBody.insertRow();
                row.innerHTML = `
                    <td class="py-3 px-6">${log.id}</td>
                    <td class="py-3 px-6">${log.user_id}</td>
                    <td class="py-3 px-6">${log.action_type}</td>
                    <td class="py-3 px-6">${log.action_description}</td>
                    <td class="py-3 px-6">${log.related_table || 'N/A'}</td>
                    <td class="py-3 px-6">${log.related_id || 'N/A'}</td>
                    <td class="py-3 px-6">${new Date(log.created_at).toLocaleString()}</td>
                `;
            });
        } else {
            noLogsMessageView.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading activity logs:', error.message);
        showMessage(`Failed to load activity logs: ${error.message}`, 'error');
    }
}


// --- Mobile Menu Toggle ---
menuButton.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Hide sidebar when clicking outside on mobile
document.addEventListener('click', (event) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menuButton.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    showView('dashboardSummaryView'); // Load dashboard summary by default
});