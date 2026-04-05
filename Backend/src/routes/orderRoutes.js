const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getKitchenOrders,
  updateKitchenStatus,
  settleOrder,
  getRunningOrderByTable,
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

// Get running order by table (for quick access on POS)
// 🔥 FIX: Moved this ABOVE the /:id routes!
router.get(
  "/table/:tableId",
  protect,
  checkSubscription,
  authorize("Owner", "Manager", "Cashier", "Waiter"),
  getRunningOrderByTable,
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
  .get(protect, checkSubscription, authorize("Owner", "Manager", "Cashier"), getOrders);

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
router.put(
  "/:id/status",
  protect,
  checkSubscription,
  authorize("Owner", "Manager", "Cashier", "Waiter"),
  updateOrderStatus,
);

// Settle the bill and clear the table
router.put(
  "/:id/settle",
  protect,
  checkSubscription,
  authorize("Owner", "Manager", "Cashier"),
  settleOrder,
);

// View specific order details
// 🔥 This wildcard route must sit below all other GET routes!
router.get(
  "/:id",
  protect,
  checkSubscription,
  authorize("Owner", "Manager", "Cashier", "Waiter"),
  getOrderById,
);

module.exports = router;
