const express = require("express");
const router = express.Router();
const {
  getAllRestaurants,
  createRestaurant,
  toggleRestaurantStatus,
  updateRestaurantPlan,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// 🔒 GOD MODE: Only users with the role 'SuperAdmin' can touch these routes
router.get("/restaurants", protect, authorize("SuperAdmin"), getAllRestaurants);
router.post("/restaurants", protect, authorize("SuperAdmin"), createRestaurant);
router.put(
  "/restaurants/:id/status",
  protect,
  authorize("SuperAdmin"),
  toggleRestaurantStatus,
);
router.put(
  "/restaurants/:id/plan",
  protect,
  authorize("SuperAdmin"),
  updateRestaurantPlan,
);

module.exports = router;
