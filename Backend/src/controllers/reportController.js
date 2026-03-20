// const Order = require("../models/Order");
// const Expense = require("../models/Expense");

// const parseDate = (dateStr, isEndOfDay = false) => {
//   if (!dateStr)
//     return isEndOfDay
//       ? new Date(new Date().setHours(23, 59, 59, 999))
//       : new Date(new Date().setHours(0, 0, 0, 0));

//   const d = new Date(dateStr);
//   if (isNaN(d.getTime())) return new Date(); // Fallback to now if invalid

//   if (isEndOfDay) d.setHours(23, 59, 59, 999);
//   else d.setHours(0, 0, 0, 0);

//   return d;
// };

// // @desc    Get Sales & P&L Reports (Daily, Weekly, Monthly)
// // @route   GET /api/reports/sales
// // @access  Private (Owner/Manager)
// const getSalesReport = async (req, res) => {
//   const restaurantId = req.user.restaurantId;
//   const { startDate, endDate } = req.query;

//   const start = parseDate(req.query.startDate);
//   const end = parseDate(req.query.endDate, true);

//   try {
//     const salesData = await Order.aggregate([
//       {
//         $match: {
//           restaurantId,
//           paymentStatus: "Paid",
//           createdAt: { $gte: start, $lte: end },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalRevenue: { $sum: "$finalAmount" },
//           totalTax: { $sum: "$tax" }, // Captures GST Report requirement [cite: 302, 420]
//           orderCount: { $sum: 1 },
//         },
//       },
//     ]);

//     const expenseData = await Expense.aggregate([
//       { $match: { restaurantId, date: { $gte: start, $lte: end } } },
//       {
//         $group: {
//           _id: null,
//           totalExpenses: {
//             $sum: {
//               $convert: {
//                 input: "$amount",
//                 to: "double",
//                 onError: 0,
//                 onNull: 0,
//               },
//             },
//           },
//         },
//       },
//     ]);

//     const revenue = salesData.length > 0 ? salesData[0].totalRevenue : 0;
//     const taxCollected = salesData.length > 0 ? salesData[0].totalTax : 0;
//     const orders = salesData.length > 0 ? salesData[0].orderCount : 0;
//     const expenses = expenseData.length > 0 ? expenseData[0].totalExpenses : 0;

//     res.json({
//       dateRange: { start, end },
//       revenue,
//       taxCollected,
//       orders,
//       expenses,
//       profit: revenue - expenses, // The true P&L [cite: 303, 421]
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error generating report data" });
//   }
// };

// module.exports = { getSalesReport };

const Order = require("../models/Order");
const Expense = require("../models/Expense");

// @desc    Get Sales & P&L Reports (Daily, Weekly, Monthly)
// @route   GET /api/reports/sales
// @access  Private (Owner/Manager)
const getSalesReport = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { startDate, endDate } = req.query;

    // 1. Bulletproof Date Parsing (Syncing perfectly with Expense logic)
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0); // Start of day

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1); // <--- THE MAGIC +1 DAY FIX

    // 2. Sales Aggregation (Revenue & Tax)
    const salesData = await Order.aggregate([
      {
        $match: {
          restaurantId,
          paymentStatus: "Paid",
          createdAt: { $gte: start, $lt: end }, // Use $lt (less than) instead of $lte
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          totalTax: { $sum: "$tax" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // 3. Expenses Aggregation (The Loophole Fix)
    const expenseData = await Expense.aggregate([
      {
        $match: {
          restaurantId,
          date: { $gte: start, $lt: end }, // Use $lt (less than) instead of $lte
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: {
            // Ensures strings don't crash the sum calculation
            $sum: {
              $convert: {
                input: "$amount",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ]);

    // 4. Extract values safely
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
      profit: revenue - expenses, // The true P&L
    });
  } catch (error) {
    console.error("REPORT AGGREGATION ERROR:", error);
    res
      .status(500)
      .json({ message: "Error generating report data", error: error.message });
  }
};

module.exports = { getSalesReport };
