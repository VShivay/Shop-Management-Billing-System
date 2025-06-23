// controllers/userController.js
const { executeQuery } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logActivity } = require('./activityLogController');

// IMPORTANT: Use the same secret key as in middleware/auth.js
const JWT_SECRET = 'your_super_secret_jwt_key';

/**
 * Registers a new user (shop owner).
 * @param {Object} req - Request object with username and password in body.
 * @param {Object} res - Response object.
 */
exports.register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

        // Insert user into database
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        const [result] = await executeQuery(sql, [username, hashedPassword]);

        // Log the activity
        await logActivity(result.insertId, 'register', `New user registered: ${username}`, 'users', result.insertId);

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username already exists' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
};

/**
 * Logs in a user.
 * @param {Object} req - Request object with username and password in body.
 * @param {Object} res - Response object.
 */
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Find user by username
        const sql = 'SELECT id, username, password FROM users WHERE username = ?';
        const [users] = await executeQuery(sql, [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = users[0];

        // Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Log the activity
        await logActivity(user.id, 'login', `User logged in: ${username}`);

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
};
