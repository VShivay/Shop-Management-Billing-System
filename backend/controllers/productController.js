// controllers/productController.js
const { executeQuery } = require('../db');
const { logActivity } = require('./activityLogController');

/**
 * Fetches products. Can filter by name if provided in body.
 * Does not use query parameters as per requirement.
 * @param {Object} req - Request object with optional 'name' in body.
 * @param {Object} res - Response object.
 */
exports.getProducts = async (req, res) => {
    const { name } = req.body; // Fetch from body, not query params

    let sql = 'SELECT id, name, type, cost_price, retail_price, wholesale_price, quantity, unit FROM products';
    const params = [];

    if (name) {
        // Use LIKE for partial matching
        sql += ' WHERE name LIKE ?';
        params.push(`%${name}%`);
    }

    try {
        const [products] = await executeQuery(sql, params);

        // Log the activity (assuming a user is logged in for this action)
        const userId = req.user ? req.user.id : null; // Get user ID from authenticated request
        if (userId) {
            await logActivity(userId, 'view_products', `Viewed products${name ? ' filtered by: ' + name : ''}`);
        }

        res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error fetching products' });
    }
};

/**
 * Adds a new product. (Optional: added for completeness)
 * @param {Object} req - Request object with product details in body.
 * @param {Object} res - Response object.
 */
exports.addProduct = async (req, res) => {
    const { name, type, cost_price, retail_price, wholesale_price, quantity, unit } = req.body;

    if (!name || !type || !cost_price || !retail_price || !wholesale_price || !quantity || !unit) {
        return res.status(400).json({ message: 'All product fields are required' });
    }

    if (!['piece', 'weight'].includes(type)) {
        return res.status(400).json({ message: 'Product type must be "piece" or "weight"' });
    }

    try {
        const sql = `
            INSERT INTO products (name, type, cost_price, retail_price, wholesale_price, quantity, unit)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await executeQuery(sql, [name, type, cost_price, retail_price, wholesale_price, quantity, unit]);

        const userId = req.user.id;
        await logActivity(userId, 'add_product', `Added new product: ${name}`, 'products', result.insertId);

        res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Internal server error adding product' });
    }
};
