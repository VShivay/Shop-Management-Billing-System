// controllers/transactionController.js
const { executeQuery } = require('../db');
const { logActivity } = require('./activityLogController');

/**
 * Records a payment against a customer's due.
 * @param {Object} req - Request object with customer_id, amount_paid, and optional note in body.
 * @param {Object} res - Response object.
 */
exports.recordPayment = async (req, res) => {
    const { customer_id, amount_paid, note } = req.body;
    const userId = req.user.id; // Get user ID from authenticated request

    if (!customer_id || !amount_paid || amount_paid <= 0) {
        return res.status(400).json({ message: 'Customer ID and a positive amount paid are required.' });
    }

    let connection;
    try {
        connection = await executeQuery('START TRANSACTION'); // Start transaction

        // 1. Get current due amount for the customer
        const [dues] = await executeQuery('SELECT total_due FROM customer_dues WHERE customer_id = ?', [customer_id]);
        if (dues.length === 0) {
            await executeQuery('ROLLBACK');
            return res.status(404).json({ message: 'Customer has no outstanding dues recorded.' });
        }

        const currentDue = dues[0].total_due;
        const newDue = Math.max(0, currentDue - amount_paid);

        // 2. Update customer_dues
        const updateDueSql = 'UPDATE customer_dues SET total_due = ? WHERE customer_id = ?';
        await executeQuery(updateDueSql, [newDue, customer_id]);

        // 3. Record the transaction
        const insertTransactionSql = `
            INSERT INTO transactions (customer_id, amount_paid, note)
            VALUES (?, ?, ?)
        `;
        const [transactionResult] = await executeQuery(insertTransactionSql, [customer_id, amount_paid, note || null]);

        await executeQuery('COMMIT'); // Commit the transaction

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
        await executeQuery('ROLLBACK'); // Rollback on any error
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Internal server error recording payment' });
    }
};
