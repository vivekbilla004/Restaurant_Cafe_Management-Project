const express = require("express");
const router = express.Router();
const {
  getTables,
  createTable,
  updateTableStatus,
  reserveTable,
  mergeTables,
} = require("../controllers/tableController");
const { protect, authorize } = require("../middleware/authMiddleware");

// 🟢 FLOOR OPS (Waiters Allowed)
router.get("/", protect, authorize("Owner", "Manager", "Waiter"), getTables);
router.put(
  "/:id/status",
  protect,
  authorize("Owner", "Manager", "Waiter"),
  updateTableStatus,
);
router.put(
  "/:id/reserve",
  protect,
  authorize("Owner", "Manager", "Waiter"),
  reserveTable,
);

// 🔴 STRUCTURAL CHANGES (Owners & Managers ONLY)
router.post("/", protect, authorize("Owner", "Manager"), createTable);
router.post("/merge", protect, authorize("Owner", "Manager"), mergeTables);

module.exports = router;
