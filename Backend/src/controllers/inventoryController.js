const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');
const OrderItem = require('../models/OrderItem');

// @desc    Add or Update Raw Material Stock
// @route   POST /api/inventory
// @access  Private (Owner/Manager)
const addStock = async (req, res) => {
  const { name, quantity, unit, minStockLevel, totalCost } = req.body;
  
  let item = await Inventory.findOne({ name, restaurantId: req.user.restaurantId });
  
  // Calculate the cost per unit (e.g., $50 for 10kg = $5/kg)
  const calculatedUnitCost = totalCost && quantity ? (totalCost / quantity) : 0;
  
  if (item) {
    // Averages out the new cost with the existing stock cost for accurate accounting
    const totalExistingValue = item.quantity * item.unitCost;
    const totalNewValue = quantity * calculatedUnitCost;
    const newTotalQuantity = item.quantity + quantity;
    
    item.unitCost = (totalExistingValue + totalNewValue) / newTotalQuantity;
    item.quantity += quantity; 
    item.minStockLevel = minStockLevel || item.minStockLevel;
    item.isActive = true; // Restore if it was previously deleted
    await item.save();
  } else {
    item = await Inventory.create({ 
      restaurantId: req.user.restaurantId, 
      name, 
      quantity, 
      unit, 
      minStockLevel,
      unitCost: calculatedUnitCost
    });
  }

  // NOTE FOR NEXT MODULE: 
  // If 'totalCost' is provided, we could automatically trigger the creation of a 
  // "Purchase" Expense record here so the owner doesn't have to enter it twice[cite: 153].

  res.status(201).json(item);
};

// @desc    Get all inventory items (with Low Stock flagged)
// @route   GET /api/inventory
// @access  Private (Owner/Manager)
const getInventory = async (req, res) => {
  const items = await Inventory.find({ restaurantId: req.user.restaurantId });
  
  // Attach a boolean flag for the frontend UI (Red Indicator) [cite: 285]
  const formattedItems = items.map(item => ({
    ...item._doc,
    isLowStock: item.quantity <= item.minStockLevel
  }));
  
  res.json(formattedItems);
};

// ==========================================
// THE CORE ENGINE: AUTO-DEDUCT LOGIC
// ==========================================
// Note: This is a helper function called by orderController, NOT a direct route.
const deductInventoryForOrder = async (orderId, restaurantId) => {
  try {
    const orderItems = await OrderItem.find({ orderId });

    for (const item of orderItems) {
      // Fetch only ACTIVE recipe mappings
      const recipes = await Recipe.find({ menuItemId: item.menuItemId, restaurantId, isActive: true });

      for (const recipe of recipes) {
        const totalDeduction = recipe.requiredQty * item.quantity;
        
        await Inventory.findOneAndUpdate(
          { _id: recipe.inventoryId, restaurantId, isActive: true },
          { $inc: { quantity: -totalDeduction } } 
        );
      }
    }
  } catch (error) {
    console.error('Inventory Deduction Failed:', error.message);
  }
};

module.exports = { addStock, getInventory, deductInventoryForOrder };