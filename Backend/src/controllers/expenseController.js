const Expense = require("../models/Expense");

const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    // Force amount to be a Number to prevent Schema validation errors
    const numericAmount = Number(amount);

    if (!title || !numericAmount) {
      return res
        .status(400)
        .json({ message: "Title and valid amount are required" });
    }

    const expense = await Expense.create({
      restaurantId: req.user.restaurantId,
      title,
      amount: numericAmount,
      category: category || "Other",
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error("Expense Save Error:", error);
    // This sends the EXACT error to your frontend so you know if it's a Schema issue
    res
      .status(500)
      .json({ message: "Failed to save expense", error: error.message });
  }
};

// @desc    Get Expenses (With Date Range Filtering for Reports)
// @route   GET /api/expenses
// @access  Private (Owner/Manager)
const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { restaurantId: req.user.restaurantId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // THE FIX: Add exactly 1 day to the end date so it captures 8:45 PM!
      end.setDate(end.getDate() + 1);

      query.date = {
        $gte: start,
        $lt: end, // Strictly less than the next day
      };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    // Safety fallback for total calculation
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + (Number(exp.amount) || 0),
      0,
    );

    res.json({ totalExpenses, expenses });
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching expenses",
        error: error.message,
      });
  }
};

module.exports = { addExpense, getExpenses };
