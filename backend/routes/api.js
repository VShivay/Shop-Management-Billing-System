// routes/api.js
const express = require('express');
const authenticateToken = require('../middleware/auth');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const customerController = require('../controllers/customerController');
const billController = require('../controllers/billController');
const transactionController = require('../controllers/transactionController');
const dashboardController = require('../controllers/dashboardController'); // IMPORT


const router = express.Router();

// --- Public Routes (Authentication not required for these) ---
router.post('/register', userController.register);
router.post('/login', userController.login);

// --- Authenticated Routes (Require JWT Token) ---
// All routes below will use the authenticateToken middleware
router.use(authenticateToken);

// Products
router.post('/products', productController.getProducts); // Use POST to get products (as per "don't use query params" for finding)
router.post('/products/add', productController.addProduct); // Example: add product (optional)

// Customers
router.post('/customers', customerController.getCustomers); // Use POST to get customers
router.post('/customers/bills', customerController.getCustomerBills); // Use POST to get customer's bills
router.get('/users/me', dashboardController.getLoggedInUser); // Added: Route to get current user details

// Bills
router.post('/bills/create', billController.createBill);
//router.get('/users/me', dashboardController.getLoggedInUser); // Added: Route to get current user details

// Dashboard Summary
router.get('/dashboard/summary', dashboardController.getDashboardSummary);


// Transactions
router.post('/transactions/record-payment', transactionController.recordPayment);

// Placeholder for other routes (e.g., activity logs)
// router.get('/activity-logs', activityLogController.getLogs); // If you decide to add a controller for viewing logs

router.post('/bills/create', billController.createBill); // Bill creation remains separate

// --- Dashboard Specific Routes (handled by dashboardController) ---
router.get('/users/me', dashboardController.getLoggedInUser); // Get current user
router.get('/dashboard/summary', dashboardController.getDashboardSummary); // Dashboard overview metrics

router.post('/dashboard/products/add', dashboardController.addProduct); // Add Product
router.post('/dashboard/products', dashboardController.getProducts);    // View/Search Products

router.post('/dashboard/customers/add', dashboardController.addCustomer); // Add Customer
router.post('/dashboard/customers', dashboardController.getCustomers);    // View/Search Customers

router.post('/dashboard/transactions/record-payment', dashboardController.recordPayment); // Record Payment
router.get('/dashboard/customer-dues', dashboardController.getCustomerDues); // View Customer Dues

router.get('/dashboard/activity-logs', dashboardController.getActivityLogs); // View Activity Logs

module.exports = router;
