// controllers/customerController.js
const { executeQuery } = require('../db');
const { logActivity } = require('./activityLogController');

/**
 * Finds a customer by name or mobile number. If not found, creates a new one.
 * @param {string} name - Customer name.
 * @param {string} mobile_no - Customer mobile number.
 * @returns {Promise<number>} - The customer ID.
 * @throws {Error} - If customer cannot be found or created.
 */
const findOrCreateCustomer = async (name, mobile_no, userId) => {
    // 1. Try to find customer by mobile_no
    let sql = 'SELECT id FROM customers WHERE mobile_no = ?';
    let [customers] = await executeQuery(sql, [mobile_no]);

    if (customers.length > 0) {
        await logActivity(userId, 'find_customer', `Found existing customer: ${name} (${mobile_no})`, 'customers', customers[0].id);
        return customers[0].id;
    }

    // 2. If not found by mobile_no, try by name (less reliable for uniqueness, but as per requirement)
    // Note: The schema has UNIQUE for mobile_no, but not for name.
    // So, searching by name might return multiple, but we'll take the first one.
    sql = 'SELECT id FROM customers WHERE name = ?';
    [customers] = await executeQuery(sql, [name]);

    if (customers.length > 0) {
        await logActivity(userId, 'find_customer', `Found existing customer by name: ${name} (mobile: ${mobile_no})`, 'customers', customers[0].id);
        return customers[0].id;
    }

    // 3. If customer still not found, create a new one
    sql = 'INSERT INTO customers (name, mobile_no) VALUES (?, ?)';
    const [result] = await executeQuery(sql, [name, mobile_no]);
    await logActivity(userId, 'create_customer', `Created new customer: ${name} (${mobile_no})`, 'customers', result.insertId);
    return result.insertId;
};

/**
 * Fetches customers by name or mobile number from the request body.
 * @param {Object} req - Request object with optional 'name' or 'mobile_no' in body.
 * @param {Object} res - Response object.
 */
exports.getCustomers = async (req, res) => {
    const { name, mobile_no } = req.body; // Fetch from body, not query params

    let sql = 'SELECT id, name, mobile_no FROM customers';
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

        const userId = req.user ? req.user.id : null;
        if (userId) {
            await logActivity(userId, 'view_customers', `Viewed customers filtered by: ${name || ''} ${mobile_no || ''}`);
        }

        res.status(200).json({ customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Internal server error fetching customers' });
    }
};

/**
 * Gets all bills for a specific customer.
 * @param {Object} req - Request object with customer_id in body.
 * @param {Object} res - Response object.
 */
exports.getCustomerBills = async (req, res) => {
    const { customer_id } = req.body; // Fetch from body

    if (!customer_id) {
        return res.status(400).json({ message: 'Customer ID is required to view bills' });
    }

    try {
        // Fetch bills for the customer
        const billsSql = `
            SELECT
                b.id AS bill_id,
                b.bill_type,
                b.total_amount,
                b.paid_amount,
                b.due_amount,
                DATE_FORMAT(b.bill_date, '%Y-%m-%d') AS bill_date,
                DATE_FORMAT(b.bill_time, '%H:%i:%s') AS bill_time,
                c.name AS customer_name,
                c.mobile_no AS customer_mobile_no
            FROM bills b
            JOIN customers c ON b.customer_id = c.id
            WHERE b.customer_id = ?
            ORDER BY b.bill_date DESC, b.bill_time DESC
        `;
        const [bills] = await executeQuery(billsSql, [customer_id]);

        if (bills.length === 0) {
            return res.status(200).json({ message: 'No bills found for this customer.', bills: [] });
        }

        // For each bill, fetch its items
        for (let bill of bills) {
            const itemsSql = `
                SELECT
                    bi.quantity,
                    bi.price_per_unit,
                    bi.total_price AS item_total_price,
                    p.name AS product_name,
                    p.unit AS product_unit
                FROM bill_items bi
                JOIN products p ON bi.product_id = p.id
                WHERE bi.bill_id = ?
            `;
            const [items] = await executeQuery(itemsSql, [bill.bill_id]);
            bill.items = items;
        }

        // Fetch customer's total due amount
        const dueSql = 'SELECT total_due FROM customer_dues WHERE customer_id = ?';
        const [dues] = await executeQuery(dueSql, [customer_id]);
        const totalCustomerDue = dues.length > 0 ? dues[0].total_due : 0;


        const userId = req.user.id;
        await logActivity(userId, 'view_customer_bills', `Viewed all bills for customer ID: ${customer_id}`, 'bills', null);


        res.status(200).json({
            customer_id,
            customer_name: bills[0].customer_name,
            customer_mobile_no: bills[0].customer_mobile_no,
            bills,
            total_customer_due: totalCustomerDue
        });

    } catch (error) {
        console.error('Error fetching customer bills:', error);
        res.status(500).json({ message: 'Internal server error fetching customer bills' });
    }
};

module.exports.findOrCreateCustomer = findOrCreateCustomer; // Export for use in billController
