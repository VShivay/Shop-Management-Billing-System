// routes/billRoutes.js
const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const productController = require('../controllers/productController'); // New: Import productController
const authenticateToken = require('../middleware/auth'); // Your authentication middleware

// Route to create a new bill (retail or wholesale)
// POST /api/bills/create
router.post('/create', authenticateToken, billController.createBill);

// Route to get details of a specific bill
// GET /api/bills/:billId
router.get('/:billId', authenticateToken, billController.getBillDetails);

// Route to get all bills and outstanding dues for a specific customer
// GET /api/customers/:customerId/bills
router.get('/customers/:customerId/bills', authenticateToken, billController.getCustomerBillsAndDues);

// Route to record a payment against a customer's dues
// POST /api/payments/record
router.post('/payments/record', authenticateToken, billController.recordPayment);

// New: Route to search for customers (for suggestion dropdowns)
// GET /api/customers/search?query=...
router.get('/customers/search', authenticateToken, billController.searchCustomers);

// New: Route to search for products (for suggestion dropdowns)
// GET /api/products/search?query=...
router.get('/products/search', authenticateToken, productController.searchProducts); // Using productController for products

module.exports = router;
