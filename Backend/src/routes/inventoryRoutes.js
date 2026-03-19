const express = require("express");
const router = express.Router();
const {
  addStock,
  getInventory,
  addRecipe,
  getRecipes,
} = require("../controllers/inventoryController");
// Assuming you create a quick recipeController with standard CRUD operations
const { protect, authorize } = require("../middleware/authMiddleware");

// --- INVENTORY ROUTES ---
// Only Owners and Managers can manage physical stock [cite: 355-365]
router
  .route("/")
  .get(protect, authorize("Owner", "Manager", "Kitchen"), getInventory) // Kitchen needs to see stock
  .post(protect, authorize("Owner", "Manager"), addStock);

// Recipe mapping APIs
router
  .route("/recipes")
  .get(protect, authorize("Owner", "Manager", "Kitchen"), getRecipes)
  .post(protect, authorize("Owner", "Manager"), addRecipe);

module.exports = router;
