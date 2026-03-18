const express = require('express');
const router = express.Router();
const { getDashboardKPIs } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/sales', protect, authorize('Owner', 'Manager'), getSalesReport)

module.exports = router;