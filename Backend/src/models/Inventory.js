// models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true }, //[cite: 100-101]
  name: { type: String, required: true }, //[cite: 103]
  quantity: { type: Number, required: true, default: 0 }, //[cite: 104]
  unit: { type: String, enum: ['Kg', 'Liter', 'Piece', 'Gram', 'ML'], required: true }, //[cite: 105, 110]
  minStockLevel: { type: Number, required: true, default: 10 } ,// Triggers Low Stock Alerts [cite: 106, 285]

  // LOOPHOLE 1 CLOSED: Tracks raw material costs for true Profit & Loss reporting
  unitCost: { type: Number, required: true, default: 0 }, 
  // LOOPHOLE 2 CLOSED: Soft delete protects historical recipe mappings
  isActive: { type: Boolean, default: true }
}, { timestamps: true }); //[cite: 107, 113]

module.exports = mongoose.model('Inventory', inventorySchema);