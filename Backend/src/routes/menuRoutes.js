const express = require("express");
const router = express.Router();
const {
  createCategory,
  createMenuItem,
  toggleMenuItemStatus,
  updateMenuItem,
  getMenuForPOS,
  archiveMenuItem,
  getMenuForAdmin,
} = require("../controllers/menuController");
const { protect, authorize } = require("../middleware/authMiddleware");

// --------------------------------------------------------
// POS Read Access (Waiters, Cashiers, Managers, Owners)
// --------------------------------------------------------
router.get("/pos-data", protect, getMenuForPOS);

// --------------------------------------------------------
// Write Access (Owners & Managers ONLY)
// --------------------------------------------------------
router.post(
  "/categories",
  protect,
  authorize("Owner", "Manager"),
  createCategory,
);
router.post("/items", protect, authorize("Owner", "Manager"), createMenuItem);
router.put(
  "/items/:id/status",
  protect,
  authorize("Owner", "Manager"),
  toggleMenuItemStatus,
);
router.put(
  "/items/:id",
  protect,
  authorize("Owner", "Manager"),
  updateMenuItem,
);
router.get(
  "/admin-data",
  protect,
  authorize("Owner", "Manager"),
  getMenuForAdmin,
);
router.put(
  "/items/:id/archive",
  protect,
  authorize("Owner", "Manager"),
  archiveMenuItem,
);

module.exports = router;
