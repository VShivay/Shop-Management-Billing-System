const db = require('../db1');

const logActivity = async ({ user_id, action_type, action_description, related_table = null, related_id = null }) => {
    const query = `
        INSERT INTO activity_logs (user_id, action_type, action_description, related_table, related_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    await db.execute(query, [user_id, action_type, action_description, related_table, related_id]);
};

module.exports = {
    logActivity
};
