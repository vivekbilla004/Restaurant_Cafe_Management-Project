const Inventory = require("../models/Inventory");
const Recipe = require("../models/Recipe");
const Order = require("../models/Order");
const Expense = require("../models/Expense"); // 🔥 NEW: Import the Expense Model

// @desc    Add or Update Raw Material Stock & Auto-Log Expense
// @route   POST /api/inventory
// @access  Private (Owner/Manager)
const addStock = async (req, res) => {
  try {
    const { name, quantity, unit, minStockLevel, totalCost } = req.body;

    let item = await Inventory.findOne({
      name,
      restaurantId: req.user.restaurantId,
    });

    // Safe math calculation
    const safeQty = Number(quantity);
    const safeTotalCost = Number(totalCost);
    const calculatedUnitCost =
      safeTotalCost && safeQty ? safeTotalCost / safeQty : 0;

    // 1. Update or Create the Inventory Record
    if (item) {
      // Averages out the new cost with the existing stock cost (Weighted Average)
      const totalExistingValue = item.quantity * item.unitCost;
      const totalNewValue = safeTotalCost;
      const newTotalQuantity = item.quantity + safeQty;

      item.unitCost =
        newTotalQuantity > 0
          ? (totalExistingValue + totalNewValue) / newTotalQuantity
          : 0;
      item.quantity += safeQty;
      item.minStockLevel = minStockLevel || item.minStockLevel;
      item.isActive = true;
      await item.save();
    } else {
      item = await Inventory.create({
        restaurantId: req.user.restaurantId,
        name,
        quantity: safeQty,
        unit,
        minStockLevel: Number(minStockLevel),
        unitCost: calculatedUnitCost,
      });
    }

    // 2. 🔥 THE AUTOMATION: Create an Expense Record instantly!
    if (safeTotalCost > 0) {
      await Expense.create({
        restaurantId: req.user.restaurantId,
        title: `Inventory Restock: ${name} (${safeQty} ${unit})`,
        amount: safeTotalCost,
        category: "Other", // Group it as an Inventory expense
        date: new Date(),
        createdBy: req.user._id,
      });
    }

    res.status(201).json(item);
  } catch (error) {
    // This will print the EXACT schema validation error in your terminal!
    console.error("Inventory Add Error:", error);
    res
      .status(500)
      .json({
        message: "Failed to add stock and log expense",
        error: error.message,
      });
  }
};

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (Owner/Manager)
const getInventory = async (req, res) => {
  const items = await Inventory.find({ restaurantId: req.user.restaurantId });

  const formattedItems = items.map((item) => ({
    ...item._doc,
    isLowStock: item.quantity <= item.minStockLevel,
  }));

  res.json(formattedItems);
};

// ==========================================
// AUTO-DEDUCT LOGIC
// ==========================================
const deductInventoryForOrder = async (orderId, restaurantId) => {
  try {
    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order || !order.items) return;

    for (const item of order.items) {
      const recipes = await Recipe.find({
        menuItemId: item.menuItemId,
        restaurantId,
        isActive: true,
      });

      for (const recipe of recipes) {
        const totalDeduction = recipe.requiredQty * item.quantity;

        await Inventory.findOneAndUpdate(
          { _id: recipe.inventoryId, restaurantId, isActive: true },
          { $inc: { quantity: -totalDeduction } },
        );
      }
    }
  } catch (error) {
    console.error("Inventory Deduction Failed:", error.message);
  }
};

// @desc    Add or Update recipe mapping
// @route   POST /api/inventory/recipes
// @access  Private (Owner/Manager)
const addRecipe = async (req, res) => {
  const { menuItemId, inventoryId, requiredQty } = req.body;

  if (!menuItemId || !inventoryId || requiredQty == null) {
    return res.status(400).json({
      message: "menuItemId, inventoryId and requiredQty are required.",
    });
  }

  const existing = await Recipe.findOne({
    menuItemId,
    inventoryId,
    restaurantId: req.user.restaurantId,
  });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.requiredQty = requiredQty;
      await existing.save();
      return res.status(200).json(existing);
    }
    return res.status(409).json({
      message:
        "Recipe already exists. Delete it first if you want to change it.",
    });
  }

  const recipe = await Recipe.create({
    restaurantId: req.user.restaurantId,
    menuItemId,
    inventoryId,
    requiredQty: Number(requiredQty),
  });

  res.status(201).json(recipe);
};

// @desc    Get all recipe mappings
// @route   GET /api/inventory/recipes
// @access  Private (Owner/Manager, Kitchen)
const getRecipes = async (req, res) => {
  const recipes = await Recipe.find({ restaurantId: req.user.restaurantId })
    .populate("menuItemId", "name")
    .populate("inventoryId", "name unit");
  res.json(recipes);
};

module.exports = {
  addStock,
  getInventory,
  addRecipe,
  getRecipes,
  deductInventoryForOrder,
};
