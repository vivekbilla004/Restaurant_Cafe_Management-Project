const express = require('express');
const router = express.Router();
const { getCurrentSubscription } = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/subscription/current
// @access  Private (Owner/Manager)
// Notice: We do NOT put 'checkSubscription' here, otherwise they couldn't see their bill to pay it!
router.get('/current', protect, authorize('Owner', 'Manager'), getCurrentSubscription);

module.exports = router;