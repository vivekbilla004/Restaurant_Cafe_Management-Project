// models/Recipe.js (The Mapping Table) [cite: 112]
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, index: true }, //[cite: 118-119]
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true }, //[cite: 120-121]
  requiredQty: { type: Number, required: true }, // e.g., 0.15 for 150ml of Milk [cite: 122-123]
  isActive: { type: Boolean, default: true } // Soft delete for recipe mappings
}, { timestamps: true });

// Prevent duplicate mappings for the same ingredient in the same menu item
recipeSchema.index({ menuItemId: 1, inventoryId: 1 }, { unique: true });

module.exports = mongoose.model('Recipe', recipeSchema);