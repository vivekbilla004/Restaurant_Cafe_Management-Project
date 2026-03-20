const express = require("express");
const router = express.Router();
const {createOrder, getOrders, getOrderById, updateOrderStatus } = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Only staff handling operations should create orders
router.route('/')
  .post(protect, authorize('Owner', 'Manager', 'Cashier', 'Waiter'), createOrder)
  .get(protect, authorize('Owner', 'Manager', 'Kitchen', 'Cashier'), getOrders);

// Everyone needs to be able to read order details (especially Kitchen for KOT)
router.get("/:id", protect, getOrderById);

router.put("/:id/status", protect, updateOrderStatus);

module.exports = router;
