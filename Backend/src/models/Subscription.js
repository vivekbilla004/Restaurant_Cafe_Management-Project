// models/Subscription.js (Required to close the loop)
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true,
    index: true // [cite: 161, 162]
  },
  plan: { type: String, enum: ['Basic', 'Pro'], required: true }, // [cite: 163, 164]
  startDate: { type: Date, required: true }, // [cite: 165]
  endDate: { type: Date, required: true }, // [cite: 167]
  status: { type: String, enum: ['Active', 'Expired'], default: 'Active' }, // [cite: 169]
  paymentId: { type: String } // Null during trial, filled upon renewal [cite: 170]
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);