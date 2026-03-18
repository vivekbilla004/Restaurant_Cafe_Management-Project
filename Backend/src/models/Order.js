// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null }, // Null for Parcel/Online
  orderType: { type: String, enum: ['DineIn', 'Parcel', 'Online'], required: true }, // [cite: 65-66]
  
  // Financials [cite: 67-74]
  totalAmount: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true, default: 0 },

  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Pending'], default: 'Pending' }, // [cite: 75-76]
  // LOOPHOLE 1 CLOSED: Ensures reports only calculate actual collected revenue
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Failed'], default: 'Unpaid' },
  status: { type: String, enum: ['Pending', 'Preparing', 'Ready', 'Completed'], default: 'Pending' }, // [cite: 77-78]
  
  // RBAC Link [cite: 79-80]
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);