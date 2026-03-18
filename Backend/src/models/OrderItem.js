// models/OrderItem.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, // [cite: 87-88]
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true }, // [cite: 89-90]
  quantity: { type: Number, required: true }, // [cite: 91-92]
  price: { type: Number, required: true }, // SNAPSHOT PRICE: Prevents past totals from changing if menu prices update [cite: 93-94]
  total: { type: Number, required: true } // [cite: 95-96]
});

module.exports = mongoose.model('OrderItem', orderItemSchema);