const bcrypt = require('bcrypt');
const db = require('./db1'); // your DB connection (mysql2/promise)
require('dotenv').config();

const seedAdminUser = async () => {
    const username = 'Vint Panchal';
    const plainPassword = '123'; // Change this before production

    try {
        // Check if user already exists
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            console.log('Admin user already exists.');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Insert admin user
        await db.execute(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        console.log('✅ Admin user created successfully.');
    } catch (err) {
        console.error('❌ Error seeding admin user:', err);
    } finally {
        process.exit(); // Exit script
    }
};

seedAdminUser();
