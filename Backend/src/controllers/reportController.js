const Order = require('../models/Order');
const Expense = require('../models/Expense');

// @desc    Get Sales & P&L Reports (Daily, Weekly, Monthly)
// @route   GET /api/reports/sales
// @access  Private (Owner/Manager)
const getSalesReport = async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { startDate, endDate } = req.query;

  // Default to today if frontend doesn't provide dates
  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) start.setHours(0, 0, 0, 0);
  
  const end = endDate ? new Date(endDate) : new Date();
  if (!endDate) end.setHours(23, 59, 59, 999);

  try {
    const salesData = await Order.aggregate([
      { 
        $match: { 
          restaurantId, 
          paymentStatus: 'Paid', 
          createdAt: { $gte: start, $lte: end } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$finalAmount' }, 
          totalTax: { $sum: '$tax' }, // Captures GST Report requirement [cite: 302, 420]
          orderCount: { $sum: 1 } 
        } 
      }
    ]);

    const expenseData = await Expense.aggregate([
      { 
        $match: { restaurantId, date: { $gte: start, $lte: end } } 
      },
      { 
        $group: { _id: null, totalExpenses: { $sum: '$amount' } } 
      }
    ]);

    const revenue = salesData.length > 0 ? salesData[0].totalRevenue : 0;
    const taxCollected = salesData.length > 0 ? salesData[0].totalTax : 0;
    const orders = salesData.length > 0 ? salesData[0].orderCount : 0;
    const expenses = expenseData.length > 0 ? expenseData[0].totalExpenses : 0;

    res.json({
      dateRange: { start, end },
      revenue,
      taxCollected,
      orders,
      expenses,
      profit: revenue - expenses // The true P&L [cite: 303, 421]
    });

  } catch (error) {
    res.status(500).json({ message: 'Error generating report data' });
  }
};

module.exports = { getSalesReport };