const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true }, //[cite: 126]
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Closes the Login vs HR loophole
  name: { type: String, required: true }, //[cite: 127]
  role: { type: String, required: true }, //[cite: 128] // e.g., Chef, Waiter, Cleaner
  salary: { type: Number, required: true }, //[cite: 129] // Monthly base salary
  
  // Storing attendance as an array of daily records [cite: 130, 138]
  attendance: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Half-Day'], required: true }
  }],
  
  isActive: { type: Boolean, default: true } // Soft delete for when employees leave
}, { timestamps: true }); //[cite: 131, 139]

module.exports = mongoose.model('Staff', staffSchema);