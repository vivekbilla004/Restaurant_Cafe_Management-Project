const express = require("express");
const router = express.Router();

// 1. Consolidated Imports
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getKitchenOrders,
  updateKitchenStatus,
} = require("../controllers/orderController");

const {
  protect,
  authorize,
  checkSubscription,
} = require("../middleware/authMiddleware");

// ==========================================
// 1. SPECIFIC ROUTES (MUST GO AT THE TOP)
// ==========================================

// KDS - Fetch active kitchen tickets
router.get(
  "/kitchen",
  protect,
  authorize("Owner", "Manager", "Kitchen"),
  getKitchenOrders,
);

// General - Get all or Create
router
  .route("/")
  .post(
    protect,
    checkSubscription,
    authorize("Owner", "Manager", "Cashier", "Waiter"),
    createOrder,
  )
  .get(protect, checkSubscription, authorize("Owner", "Manager"), getOrders);

// ==========================================
// 2. DYNAMIC ROUTES WITH /:id (MUST GO AT THE BOTTOM)
// ==========================================

// KDS - Update kitchen status (Preparing/Ready)
router.put(
  "/:id/kitchen-status",
  protect,
  authorize("Owner", "Manager", "Kitchen"),
  updateKitchenStatus,
);

// POS/Floor - Update main order status (Paid, Cancelled, etc)
// 🔒 LOOPHOLE CLOSED: Kitchen staff cannot touch this route anymore!
router.put(
  "/:id/status",
  protect,
  checkSubscription,
  authorize("Owner", "Manager", "Cashier", "Waiter"),
  updateOrderStatus,
);

// View specific order details
router.get(
  "/:id",
  protect,
  checkSubscription,
  authorize("Owner", "Manager", "Cashier", "Waiter"), // Waiters need to see order details too!
  getOrderById,
);

module.exports = router;
