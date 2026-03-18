const Expense = require('../models/Expense');

// @desc    Add a new Expense
// @route   POST /api/expenses
// @access  Private (Owner/Manager)
const addExpense = async (req, res) => {
  const { title, amount, category, date } = req.body;

  const expense = await Expense.create({
    restaurantId: req.user.restaurantId,
    title,
    amount,
    category,
    date: date || new Date()
  });

  res.status(201).json(expense);
};

// @desc    Get Expenses (With Date Range Filtering for Reports)
// @route   GET /api/expenses
// @access  Private (Owner/Manager)
const getExpenses = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = { restaurantId: req.user.restaurantId };

  // If frontend passes dates, filter by them. Otherwise, return all.
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const expenses = await Expense.find(query).sort({ date: -1 });
  
  // Automatically calculate total for the frontend
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  res.json({ totalExpenses, expenses });
};

module.exports = { addExpense, getExpenses };