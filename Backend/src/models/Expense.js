const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true }, //[cite: 144-145]
  title: { type: String, required: true }, //[cite: 146-147] // e.g., "March Electricity", "Plumber"
  amount: { type: Number, required: true }, //[cite: 148, 152]
  category: { 
    type: String, 
    enum: ['Rent', 'Salary', 'Purchase', 'Utility', 'Marketing', 'Other'], // Expanded for better reporting [cite: 149, 153]
    required: true 
  },
  date: { type: Date, required: true, default: Date.now } //[cite: 150, 154]
}, { timestamps: true }); //[cite: 151, 155]

// Indexing date speeds up the Monthly Profit & Loss queries significantly
expenseSchema.index({ restaurantId: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);