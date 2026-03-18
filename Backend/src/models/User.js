const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true // Crucial for multi-tenant speed [cite: 15, 172]
  },
  name: {
    type: String,
    required: true // 
  },
  email: {
    type: String,
    required: true,
    unique: true // 
  },
  password: {
    type: String,
    required: true // Encrypted as per SRS 
  },
  role: {
    type: String,
    enum: ['Owner', 'Manager', 'Cashier', 'Waiter', 'Kitchen'], // Exact roles from SRS 
    required: true
  },
  isActive: {
    type: Boolean,
    default: true // Used to lock out employees who leave 
  }
}, { timestamps: true }); // Automatically adds createdAt 

// Pre-save hook to encrypt password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);