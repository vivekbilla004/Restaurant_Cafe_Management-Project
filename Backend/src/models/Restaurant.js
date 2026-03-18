// models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // [cite: 25]
  phone: { type: String, required: true }, // [cite: 27]
  address: { type: String, required: true }, // [cite: 29]
  plan: { type: String, enum: ['Basic', 'Pro'], default: 'Basic' }, // [cite: 31, 32]
  trialStartDate: { type: Date }, // [cite: 33]
  trialEndDate: { type: Date }, // [cite: 35]
  isActive: { type: Boolean, default: true } // [cite: 37]
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);