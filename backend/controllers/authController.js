const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userModel = require('../models/userModel');
const activityLog = require('../models/activityLogModel');

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await userModel.findUserByUsername(username);
        if (!user) return res.status(401).json({ message: 'Invalid username or password.' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ message: 'Invalid username or password.' });

        const tokenPayload = { id: user.id, username: user.username };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });

        // Log activity
        await activityLog.logActivity({
            user_id: user.id,
            action_type: 'login',
            action_description: `User ${user.username} logged in.`,
        });

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

module.exports = {
    login
};
