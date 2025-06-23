const db = require('../db1'); // your DB connection file

const findUserByUsername = async (username) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0]; // undefined if not found
};

module.exports = {
    findUserByUsername
};
