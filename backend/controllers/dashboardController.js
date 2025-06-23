// controllers/dashboardController.js
// Import pool for transaction management, and executeQuery for simple queries
const { pool, executeQuery } = require('../db');
const { logActivity } = require('./activityLogController');

/**
 * Fetches summary statistics for the dashboard.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getDashboardSummary = async (req, res) => {
    const userId = req.user.id; // User ID from authentication middleware

    try {
        // 1. Total Sales Today
        const [salesResult] = await executeQuery(
            `SELECT COALESCE(SUM(total_amount), 0) AS totalSalesToday FROM bills WHERE DATE(created_at) = CURRENT_DATE()`
        );
        const totalSalesToday = salesResult[0].totalSalesToday;

        // 2. Retail Sales Today
        const [retailSalesResult] = await executeQuery(
            `SELECT COALESCE(SUM(total_amount), 0) AS retailSalesToday FROM bills WHERE bill_type = 'retail' AND DATE(created_at) = CURRENT_DATE()`
        );
        const retailSalesToday = retailSalesResult[0].retailSalesToday;

        // 3. Wholesale Sales Today
        const [wholesaleSalesResult] = await executeQuery(
            `SELECT COALESCE(SUM(total_amount), 0) AS wholesaleSalesToday FROM bills WHERE bill_type = 'wholesale' AND DATE(created_at) = CURRENT_DATE()`
        );
        const wholesaleSalesToday = wholesaleSalesResult[0].wholesaleSalesToday;

        // 4. Total Dues Outstanding
        const [duesResult] = await executeQuery(
            `SELECT COALESCE(SUM(total_due), 0) AS totalDuesOutstanding FROM customer_dues`
        );
        const totalDuesOutstanding = duesResult[0].totalDuesOutstanding;

        // 5. Total Products in Stock
        const [stockResult] = await executeQuery(
            `SELECT COALESCE(SUM(quantity), 0) AS totalProductsInStock FROM products`
        );
        const totalProductsInStock = stockResult[0].totalProductsInStock;

        // 6. Top Selling Product Today (by total_price in bill_items for today's bills)
        const [topProductResult] = await executeQuery(
            `SELECT p.name AS topSellingProductName, SUM(bi.total_price) AS totalSoldValue
             FROM bill_items bi
             JOIN bills b ON bi.bill_id = b.id
             JOIN products p ON bi.product_id = p.id
             WHERE DATE(b.created_at) = CURRENT_DATE()
             GROUP BY p.id, p.name
             ORDER BY totalSoldValue DESC
             LIMIT 1`
        );
        const topSellingProductToday = topProductResult.length > 0 ? topProductResult[0].topSellingProductName : 'N/A';


        await logActivity(userId, 'view_dashboard_summary', 'Viewed dashboard summary statistics.');

        res.status(200).json({
            totalSalesToday: parseFloat(totalSalesToday),
            retailSalesToday: parseFloat(retailSalesToday),       // New
            wholesaleSalesToday: parseFloat(wholesaleSalesToday), // New
            totalDuesOutstanding: parseFloat(totalDuesOutstanding),
            totalProductsInStock: parseFloat(totalProductsInStock),
            topSellingProductToday: topSellingProductToday        // New
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Internal server error fetching dashboard summary.' });
    }
};

/**
 * Fetches details of the currently logged-in user.
 * @param {Object} req - Express request object (req.user will have id and username from JWT).
 * @param {Object} res - Express response object.
 */
exports.getLoggedInUser = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    await logActivity(req.user.id, 'get_user_info', `Fetched current user info for ${req.user.username}.`);
    res.status(200).json({
        id: req.user.id,
        username: req.user.username
    });
};

/**
 * Dashboard: Adds a new product.
 * @param {Object} req - Request object with product details in body.
 * @param {Object} res - Response object.
 */
exports.addProduct = async (req, res) => {
    const { name, type, cost_price, retail_price, wholesale_price, quantity, unit } = req.body;
    const userId = req.user.id;

    if (!name || !type || cost_price === undefined || retail_price === undefined || wholesale_price === undefined || quantity === undefined || !unit) {
        return res.status(400).json({ message: 'All product fields are required.' });
    }

    if (!['piece', 'weight'].includes(type)) {
        return res.status(400).json({ message: 'Product type must be "piece" or "weight".' });
    }

    try {
        const sql = `
            INSERT INTO products (name, type, cost_price, retail_price, wholesale_price, quantity, unit)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await executeQuery(sql, [name, type, cost_price, retail_price, wholesale_price, quantity, unit]);

        await logActivity(userId, 'add_product', `Added new product: ${name}`, 'products', result.insertId);

        res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Product with this name already exists.' });
        }
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Internal server error adding product.' });
    }
};

/**
 * Dashboard: Fetches products. Can filter by name if provided in body.
 * @param {Object} req - Request object with optional 'name' in body.
 * @param {Object} res - Response object.
 */
exports.getProducts = async (req, res) => {
    const { name } = req.body; // Fetch from body, not query params
    const userId = req.user.id;

    let sql = 'SELECT id, name, type, cost_price, retail_price, wholesale_price, quantity, unit, created_at FROM products';
    const params = [];

    if (name) {
        sql += ' WHERE name LIKE ?';
        params.push(`%${name}%`);
    }

    try {
        const [products] = await executeQuery(sql, params);
        await logActivity(userId, 'view_products', `Viewed products${name ? ' filtered by: ' + name : ''}`);
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error fetching products.' });
    }
};

/**
 * Dashboard: Adds a new customer.
 * @param {Object} req - Request object with customer details in body.
 * @param {Object} res - Response object.
 */
exports.addCustomer = async (req, res) => {
    const { name, mobile_no } = req.body;
    const userId = req.user.id;

    if (!name || !mobile_no) {
        return res.status(400).json({ message: 'Customer name and mobile number are required.' });
    }

    try {
        const sql = 'INSERT INTO customers (name, mobile_no) VALUES (?, ?)';
        const [result] = await executeQuery(sql, [name, mobile_no]);

        await logActivity(userId, 'add_customer', `Added new customer: ${name} (${mobile_no})`, 'customers', result.insertId);

        res.status(201).json({ message: 'Customer added successfully', customerId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Customer with this mobile number already exists.' });
        }
        console.error('Error adding customer:', error);
        res.status(500).json({ message: 'Internal server error adding customer.' });
    }
};

/**
 * Dashboard: Fetches customers. Can filter by name or mobile number.
 * @param {Object} req - Request object with optional 'name' or 'mobile_no' in body.
 * @param {Object} res - Response object.
 */
exports.getCustomers = async (req, res) => {
    const { name, mobile_no } = req.body; // Fetch from body, not query params
    const userId = req.user.id;

    let sql = 'SELECT id, name, mobile_no, created_at FROM customers';
    const params = [];
    const conditions = [];

    if (name) {
        conditions.push('name LIKE ?');
        params.push(`%${name}%`);
    }
    if (mobile_no) {
        conditions.push('mobile_no = ?');
        params.push(mobile_no);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' OR ');
    }

    try {
        const [customers] = await executeQuery(sql, params);
        await logActivity(userId, 'view_customers', `Viewed customers filtered by: ${name || ''} ${mobile_no || ''}`);
        res.status(200).json({ customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Internal server error fetching customers.' });
    }
};

/**
 * Dashboard: Records a payment against a customer's due.
 * @param {Object} req - Request object with customer_id, amount_paid, and optional note in body.
 * @param {Object} res - Response object.
 */
exports.recordPayment = async (req, res) => {
    const { customer_id, amount_paid, note } = req.body;
    const userId = req.user.id;

    if (!customer_id || !amount_paid || amount_paid <= 0) {
        return res.status(400).json({ message: 'Customer ID and a positive amount paid are required.' });
    }

    let connection;
    let newDue; // Declare newDue here to make it accessible throughout the try block
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Get current due amount for the customer
        const [dues] = await connection.execute('SELECT total_due FROM customer_dues WHERE customer_id = ? FOR UPDATE', [customer_id]);
        if (dues.length === 0) {
            // If no existing due, check if the customer exists at all
            const [customerExists] = await connection.execute('SELECT id FROM customers WHERE id = ?', [customer_id]);
            if (customerExists.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Customer not found.' });
            }
            // If customer exists but no due, treat current due as 0
            const currentDue = 0;
            newDue = Math.max(0, currentDue - amount_paid); // Assign to the outer-scoped newDue
            // Insert into customer_dues if it doesn't exist
            const insertDueSql = `INSERT INTO customer_dues (customer_id, total_due) VALUES (?, ?)`;
            await connection.execute(insertDueSql, [customer_id, newDue]);

        } else {
            const currentDue = parseFloat(dues[0].total_due);
            newDue = Math.max(0, currentDue - amount_paid); // Assign to the outer-scoped newDue

            // 2. Update customer_dues
            const updateDueSql = 'UPDATE customer_dues SET total_due = ? WHERE customer_id = ?';
            await connection.execute(updateDueSql, [newDue, customer_id]);
        }


        // 3. Record the transaction
        const insertTransactionSql = `
            INSERT INTO transactions (customer_id, amount_paid, note)
            VALUES (?, ?, ?)
        `;
        const [transactionResult] = await connection.execute(insertTransactionSql, [customer_id, amount_paid, note || null]);

        await connection.commit();

        await logActivity(userId, 'record_payment',
            `Recorded payment of ${amount_paid} for customer ID: ${customer_id}. New due: ${newDue}.`,
            'transactions', transactionResult.insertId
        );

        res.status(200).json({
            message: 'Payment recorded successfully',
            customerId: customer_id,
            amount_paid: amount_paid,
            new_total_due: newDue
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Internal server error recording payment.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Dashboard: Fetches all customers with their outstanding dues.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getCustomerDues = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT
                c.id AS customer_id,
                c.name AS customer_name,
                c.mobile_no AS customer_mobile_no,
                COALESCE(cd.total_due, 0) AS total_due,
                cd.updated_at
            FROM customers c
            LEFT JOIN customer_dues cd ON c.id = cd.customer_id
            WHERE COALESCE(cd.total_due, 0) > 0 -- Only show customers with actual dues
            ORDER BY COALESCE(cd.total_due, 0) DESC, c.name ASC
        `;
        const [customerDues] = await executeQuery(sql);

        await logActivity(userId, 'view_customer_dues', 'Viewed all customer dues.');

        res.status(200).json({ customerDues });
    } catch (error) {
        console.error('Error fetching customer dues:', error);
        res.status(500).json({ message: 'Internal server error fetching customer dues.' });
    }
};

/**
 * Dashboard: Fetches all activity logs.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getActivityLogs = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT
                al.id,
                al.user_id,
                u.username,
                al.action_type,
                al.action_description,
                al.related_table,
                al.related_id,
                al.created_at
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100 -- Limit to recent 100 logs for performance
        `;
        const [activityLogs] = await executeQuery(sql);

        await logActivity(userId, 'view_activity_logs', 'Viewed system activity logs.');

        res.status(200).json({ activityLogs });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ message: 'Internal server error fetching activity logs.' });
    }
};
