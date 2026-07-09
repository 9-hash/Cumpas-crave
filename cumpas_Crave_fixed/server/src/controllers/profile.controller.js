const StudentModel = require('../models/student.model');
const logger = require('../utils/logger');

async function getProfile(req, res) {
    try {
        const profile = await StudentModel.findProfileByUserId(req.user.id);
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }
        res.json({ success: true, data: { user: req.user, profile } });
    } catch (error) {
        logger.error('Get profile failed', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
}

async function updateProfile(req, res) {
    const { full_name, institution, department, year_of_study, phone_number } = req.body;
    try {
        const profile = await StudentModel.updateProfile(req.user.id, {
            fullName: full_name, institution, department, yearOfStudy: year_of_study, phoneNumber: phone_number,
        });
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }
        logger.info('Profile updated', { userId: req.user.id });
        res.json({ success: true, data: profile });
    } catch (error) {
        logger.error('Update profile failed', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
}

module.exports = { getProfile, updateProfile };
