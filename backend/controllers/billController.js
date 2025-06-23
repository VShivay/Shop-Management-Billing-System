// controllers/billController.js
// Import both 'pool' for transactions and 'executeQuery' for other simple queries
const { pool, executeQuery } = require('../db');
const { logActivity } = require('./activityLogController');
const { findOrCreateCustomer } = require('./customerController');

/**
 * Creates a new bill (retail or wholesale).
 * Request Body Example:
 * {
 * "bill_type": "retail" | "wholesale",
 * "customer_info": { // Required for wholesale
 * "name": "John Doe",
 * "mobile_no": "9876543210"
 * },
 * "products_selected": [
 * { "product_id": 1, "quantity_sold": 2.5 },
 * { "product_id": 2, "quantity_sold": 1 }
 * ],
 * "paid_amount": 1300 // For wholesale, this can be less than total
 * }
 * @param {Object} req - Request object.
 * @param {Object} res - Response object.
 */
exports.createBill = async (req, res) => {
    const { bill_type, customer_info, products_selected, paid_amount } = req.body;
    const userId = req.user.id; // Get user ID from authenticated request

    if (!bill_type || !products_selected || !Array.isArray(products_selected) || products_selected.length === 0) {
        return res.status(400).json({ message: 'Bill type and selected products are required.' });
    }

    if (!['retail', 'wholesale'].includes(bill_type)) {
        return res.status(400).json({ message: 'Invalid bill_type. Must be "retail" or "wholesale".' });
    }

    if (bill_type === 'wholesale' && (!customer_info || !customer_info.name || !customer_info.mobile_no)) {
        return res.status(400).json({ message: 'Customer information (name, mobile_no) is required for wholesale bills.' });
    }

    let connection; // Declare connection here so it's accessible in finally block
    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start the transaction on this specific connection

        let customerId = null;
        if (bill_type === 'wholesale') {
            customerId = await findOrCreateCustomer(customer_info.name, customer_info.mobile_no, userId);
        }

        let totalBillAmount = 0;
        const billItemsToInsert = [];
        const productsToUpdate = [];

        // Fetch product details and validate quantities within the transaction
        for (const item of products_selected) {
            const { product_id, quantity_sold } = item;
            if (!product_id || !quantity_sold || quantity_sold <= 0) {
                await connection.rollback(); // Rollback if validation fails
                return res.status(400).json({ message: 'Each selected product must have a valid product_id and quantity_sold.' });
            }

            // Use connection.execute for queries within the transaction
            // Adding FOR UPDATE to prevent race conditions on stock during concurrent bill creation
            const [products] = await connection.execute('SELECT id, name, type, retail_price, wholesale_price, quantity, unit FROM products WHERE id = ? FOR UPDATE', [product_id]);
            if (products.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: `Product with ID ${product_id} not found.` });
            }

            const product = products[0];

            if (parseFloat(product.quantity) < quantity_sold) { // Ensure stock quantity is treated as number
                await connection.rollback();
                return res.status(400).json({ message: `Insufficient stock for product "${product.name}". Available: ${product.quantity} ${product.unit}, Requested: ${quantity_sold} ${product.unit}` });
            }

            const pricePerUnit = bill_type === 'retail' ? parseFloat(product.retail_price) : parseFloat(product.wholesale_price);
            const itemTotalPrice = pricePerUnit * quantity_sold;
            totalBillAmount += itemTotalPrice;

            billItemsToInsert.push({
                product_id: product.id,
                quantity: quantity_sold,
                price_per_unit: pricePerUnit,
                total_price: itemTotalPrice
            });

            productsToUpdate.push({
                product_id: product.id,
                new_quantity: parseFloat(product.quantity) - quantity_sold // Ensure quantity is number
            });
        }

        // Determine paid and due amounts
        const finalPaidAmount = parseFloat(paid_amount) || 0;

        // --- NEW LOGIC: Enforce no due for retail bills ---
        let finalDueAmount = 0; // Default due to 0
        if (bill_type === 'retail') {
            if (finalPaidAmount < totalBillAmount) {
                await connection.rollback();
                return res.status(400).json({ message: `For retail bills, the paid amount ($${finalPaidAmount.toFixed(2)}) must cover the total amount ($${totalBillAmount.toFixed(2)}).` });
            }
            finalDueAmount = 0; // Explicitly set to 0 for retail
        } else if (bill_type === 'wholesale') {
            finalDueAmount = Math.max(0, totalBillAmount - finalPaidAmount);
        }
        // --- END NEW LOGIC ---

        // Insert into bills table using connection.execute
        const insertBillSql = `
            INSERT INTO bills (bill_type, customer_id, total_amount, paid_amount, due_amount)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [billResult] = await connection.execute(insertBillSql, [bill_type, customerId, totalBillAmount, finalPaidAmount, finalDueAmount]);
        const billId = billResult.insertId;

        // Insert into bill_items table using connection.execute
        for (const item of billItemsToInsert) {
            const insertItemSql = `
                INSERT INTO bill_items (bill_id, product_id, quantity, price_per_unit, total_price)
                VALUES (?, ?, ?, ?, ?)
            `;
            await connection.execute(insertItemSql, [billId, item.product_id, item.quantity, item.price_per_unit, item.total_price]);
        }

        // Update product quantities using connection.execute
        for (const product of productsToUpdate) {
            const updateProductSql = 'UPDATE products SET quantity = ? WHERE id = ?';
            await connection.execute(updateProductSql, [product.new_quantity, product.product_id]);
        }

        // Handle wholesale dues
        if (bill_type === 'wholesale' && finalDueAmount > 0) {
            const updateDueSql = `
                INSERT INTO customer_dues (customer_id, total_due)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE total_due = total_due + VALUES(total_due)
            `;
            await connection.execute(updateDueSql, [customerId, finalDueAmount]);
        }

        await connection.commit(); // Commit the transaction

        await logActivity(userId, 'create_bill',
            `Created a ${bill_type} bill (ID: ${billId}) with total amount ${totalBillAmount.toFixed(2)}. Due: ${finalDueAmount.toFixed(2)}.`,
            'bills', billId
        );

        res.status(201).json({
            message: 'Bill created successfully',
            billId,
            total_amount: totalBillAmount,
            paid_amount: finalPaidAmount,
            due_amount: finalDueAmount,
            customer_id: customerId,
            bill_type: bill_type
        });

    } catch (error) {
        if (connection) {
            // Only attempt rollback if connection was successfully obtained
            await connection.rollback();
        }
        console.error('Error creating bill:', error);
        res.status(500).json({ message: 'Internal server error while creating bill' });
    } finally {
        if (connection) {
            // Always release the connection back to the pool
            connection.release();
        }
    }
};
