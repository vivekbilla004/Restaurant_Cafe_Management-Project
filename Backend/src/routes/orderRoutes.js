const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Only staff handling operations should create orders
router.post(
  "/",
  protect,
  authorize("Owner", "Manager", "Cashier", "Waiter"),
  orderController.createOrder,
);

// Everyone needs to be able to read order details (especially Kitchen for KOT)
router.get("/:id", protect, orderController.getOrderById);

router.put("/:id/status", protect, orderController.updateOrderStatus);

module.exports = router;
