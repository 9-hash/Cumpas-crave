const express = require('express');
const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

module.exports = router;
