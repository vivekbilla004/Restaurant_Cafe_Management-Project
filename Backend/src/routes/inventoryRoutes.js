const express = require("express");
const router = express.Router();
const {
  addStock,
  getInventory,
  addRecipe,
  getRecipes,
} = require("../controllers/inventoryController");
// Assuming you create a quick recipeController with standard CRUD operations
const {
  protect,
  authorize,
  checkSubscription,
} = require("../middleware/authMiddleware");

// --- INVENTORY ROUTES ---
// Only Owners and Managers can manage physical stock [cite: 355-365]
router
  .route("/")
  .get(protect, checkSubscription, authorize("Owner", "Kitchen" ,"Manager"), getInventory) // Kitchen needs to see stock
  .post(protect, checkSubscription, authorize("Owner" , "Manager"), addStock);

// Recipe mapping APIs
router
  .route("/recipes")
  .get(protect, checkSubscription, authorize("Owner", "Kitchen", "Manager"), getRecipes)
  .post(protect, checkSubscription,  authorize("Owner"), addRecipe);

module.exports = router;
