const express = require('express');
const router = express.Router();
const { addExpense, getExpenses } = require('../controllers/expenseController');
const { protect, authorize ,checkSubscription} = require('../middleware/authMiddleware');

router.route('/')
  .post(protect,checkSubscription ,authorize('Owner', 'Manager'), addExpense)
  .get(protect, checkSubscription, authorize('Owner', 'Manager'), getExpenses);

module.exports = router;