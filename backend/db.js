// db.js
const mysql = require('mysql2/promise'); 
require('dotenv').config();// Using mysql2 for promise-based queries

// IMPORTANT: Replace with your actual database credentials
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Executes a single SQL query outside of a transaction.
 * For transaction management, get a connection from the pool and use connection.execute.
 * @param {string} sql - The SQL query string.
 * @param {Array<any>} params - Parameters for the query.
 * @returns {Promise<[Array<any>, Array<any>]>} - Query result.
 */
async function executeQuery(sql, params = []) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows, fields] = await connection.execute(sql, params);
        return [rows, fields];
    } catch (error) {
        console.error('Database query error:', error);
        throw error; // Re-throw to be handled by the calling function/controller
    } finally {
        if (connection) connection.release(); // Release the connection back to the pool
    }
}

module.exports = {
    pool, // Export the pool directly for transaction management in controllers
    executeQuery // Keep executeQuery for simple, non-transactional operations
};
