const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    tableNumber: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Reserved"],
      default: "Available",
    },
    // LOOPHOLE 1 CLOSED: Instantly links the POS to the active bill
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    // LOOPHOLE 2 CLOSED: Protects historical order data
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
module.exports = mongoose.model("Table", tableSchema);
