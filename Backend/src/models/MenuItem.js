// models/MenuItem.js
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true 
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true // Speeds up category-based POS filtering [cite: 178]
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  image: { 
    type: String, // Will store a URL (e.g., from AWS S3 or Cloudinary) [cite: 39]
    default: '' 
  },
  isAvailable: { 
    type: Boolean, 
    default: true // Used to hide items without deleting historical data [cite: 39, 269]
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);