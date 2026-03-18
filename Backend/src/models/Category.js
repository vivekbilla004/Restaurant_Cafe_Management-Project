// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true // Required for fast POS filtering
  },
  name: { 
    type: String, 
    required: true 
  },
  isAvailable: { type: Boolean, default: true } // LOOPHOLE CLOSED: Soft-delete for Categories
}, { timestamps: true }); // Auto-handles createdAt [cite: 39]

module.exports = mongoose.model('Category', categorySchema);