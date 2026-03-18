const express = require('express');
const router = express.Router();
const { addExpense, getExpenses } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('Owner', 'Manager'), addExpense)
  .get(protect, authorize('Owner', 'Manager'), getExpenses);

module.exports = router;