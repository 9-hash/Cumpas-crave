const pool = require('../config/database');

const StudentModel = {
    async create({ userId, fullName, regNo, institution, department, yearOfStudy, phoneNumber }, client = pool) {
        const result = await client.query(
            `INSERT INTO students (user_id, full_name, reg_no, institution, department, year_of_study, phone_number, verification_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
             RETURNING *`,
            [userId, fullName, regNo, institution, department || null, yearOfStudy || null, phoneNumber]
        );
        return result.rows[0];
    },

    async findByUserId(userId) {
        const result = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    },

    async findProfileByUserId(userId) {
        const result = await pool.query(
            `SELECT s.*, u.username, u.email
             FROM students s JOIN users u ON s.user_id = u.id
             WHERE s.user_id = $1`,
            [userId]
        );
        return result.rows[0] || null;
    },

    async updateProfile(userId, { fullName, institution, department, yearOfStudy, phoneNumber }) {
        const result = await pool.query(
            `UPDATE students SET
                full_name = COALESCE($1, full_name),
                institution = COALESCE($2, institution),
                department = COALESCE($3, department),
                year_of_study = COALESCE($4, year_of_study),
                phone_number = COALESCE($5, phone_number)
             WHERE user_id = $6 RETURNING *`,
            [fullName, institution, department, yearOfStudy, phoneNumber, userId]
        );
        return result.rows[0] || null;
    },
};

module.exports = StudentModel;
