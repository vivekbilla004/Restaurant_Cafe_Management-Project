const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Make sure this is imported!

const userSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Owner", "Manager", "Cashier", "Waiter", "Kitchen"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// 1. Hook to hash the password BEFORE saving it to the database
userSchema.pre("save", async function (next) {
  // If the password isn't being modified, move on
  if (!this.isModified("password")) {
    return next();
  }
  // Hash the plain text password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 2. Method to compare entered password with the hashed password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
