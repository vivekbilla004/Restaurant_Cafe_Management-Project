const express = require("express");
const router = express.Router();
const {
  addStock,
  getInventory,
} = require("../controllers/inventoryController");
// Assuming you create a quick recipeController with standard CRUD operations
const {
  addRecipeMapping,
  getRecipesForMenuItem,
} = require("../controllers/recipeController");
const { protect, authorize } = require("../middleware/authMiddleware");

// --- INVENTORY ROUTES ---
// Only Owners and Managers can manage physical stock [cite: 355-365]
router
  .route("/")
  .get(protect, authorize("Owner", "Manager", "Kitchen"), getInventory) // Kitchen needs to see stock
  .post(protect, authorize("Owner", "Manager"), addStock);

// --- RECIPE MAPPING ROUTES ---
// Linking Raw Materials to Menu Items
router
  .route("/recipes")
  .post(protect, authorize("Owner", "Manager"), addRecipeMapping);

router.get(
  "/recipes/:menuItemId",
  protect,
  authorize("Owner", "Manager", "Kitchen"),
  getRecipesForMenuItem,
);

module.exports = router;
