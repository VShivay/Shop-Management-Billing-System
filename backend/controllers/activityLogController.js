// controllers/activityLogController.js
const { executeQuery } = require('../db');

/**
 * Logs an activity into the activity_logs table.
 * @param {number} userId - The ID of the user performing the action.
 * @param {string} actionType - Type of action (e.g., 'login', 'create_bill').
 * @param {string} actionDescription - Detailed description of the action.
 * @param {string} [relatedTable=null] - Optional: The table affected.
 * @param {number} [relatedId=null] - Optional: The ID of the affected record.
 */
const logActivity = async (userId, actionType, actionDescription, relatedTable = null, relatedId = null) => {
    try {
        const sql = `
            INSERT INTO activity_logs (user_id, action_type, action_description, related_table, related_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        await executeQuery(sql, [userId, actionType, actionDescription, relatedTable, relatedId]);
        console.log(`Activity logged: ${actionType} by user ${userId}`);
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Do not re-throw, as logging should not block the main operation
    }
};

module.exports = {
    logActivity
};
