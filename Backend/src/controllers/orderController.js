const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");

// @desc    Create new order & order items
// @route   POST /api/orders
// @access  Private (Cashier, Waiter, Manager, Owner)
const createOrder = async (req, res) => {
  const {
    tableId,
    orderType,
    items,
    discount = 0,
    tax = 0,
    paymentMode = "Pending",
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No order items provided" });
  }

  try {
    let calculatedTotalAmount = 0;
    const orderItemsToInsert = [];

    // 1. Loop through items to validate prices and calculate totals securely
    // We NEVER trust the frontend price. We fetch it fresh from the database.
    for (const item of items) {
      const menuItem = await MenuItem.findOne({
        _id: item.menuItemId,
        restaurantId: req.user.restaurantId,
      });

      if (!menuItem) {
        return res
          .status(404)
          .json({ message: `Menu item ${item.menuItemId} not found` });
      }

      const itemTotal = menuItem.price * item.quantity;
      calculatedTotalAmount += itemTotal;

      orderItemsToInsert.push({
        menuItemId: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price, // Saving the snapshot price
        total: itemTotal,
      });
    }

    const finalAmount = calculatedTotalAmount - discount + tax;

    // 2. Create the Parent Order
    const order = await Order.create({
      restaurantId: req.user.restaurantId,
      tableId: orderType === "DineIn" ? tableId : null,
      orderType,
      totalAmount: calculatedTotalAmount,
      discount,
      tax,
      finalAmount,
      paymentMode,
      status: "Pending", // Sends it to the KOT automatically
      createdBy: req.user._id, // Using the JWT user ID [cite: 79-80]
    });

    // 3. Inject the new orderId into our prepared OrderItems and save them
    const preparedOrderItems = orderItemsToInsert.map((item) => ({
      ...item,
      orderId: order._id,
    }));
    await OrderItem.insertMany(preparedOrderItems);

    // 4. Update the Table Status (Closing the Loophole)
    if (orderType === "DineIn" && tableId) {
      await Table.findOneAndUpdate(
        { _id: tableId, restaurantId: req.user.restaurantId },
        { status: "Occupied", currentOrderId: order._id }, // Links the table to this active bill
      );
    }

    res
      .status(201)
      .json({ message: "Order created successfully", orderId: order._id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing order", error: error.message });
  }
};

// @desc    Get order details (for KOT or Bill Printing)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  })
    .populate("tableId", "tableNumber")
    .populate("createdBy", "name");

  if (!order) return res.status(404).json({ message: "Order not found" });

  // Fetch the associated items
  const orderItems = await OrderItem.find({ orderId: order._id }).populate(
    "menuItemId",
    "name image",
  );

  res.json({ order, orderItems });
};
// @desc    Update Order Status & Trigger Inventory Deduction
// @route   PUT /api/orders/:id/status
// @access  Private (Kitchen, Waiter, Cashier, Manager)
const updateOrderStatus = async (req, res) => {
  const { status, paymentStatus, paymentMode } = req.body;
  const order = await Order.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  });

  if (!order) return res.status(404).json({ message: "Order not found" });

  // Update Kitchen Status (Pending -> Preparing -> Ready -> Completed)
  if (status) order.status = status;

  // LOOPHOLE 2 CLOSED: Trigger Inventory Auto-Deduct when Kitchen starts preparing
  if (status === "Preparing" && order.status !== "Preparing") {
    // We will build this function in the Inventory Module next!
    // await deductInventoryForOrder(order._id, req.user.restaurantId);
  }

  // Handle Payment Completion
  if (paymentStatus === "Paid") {
    order.paymentStatus = "Paid";
    order.paymentMode = paymentMode || order.paymentMode;

    // Free up the table if it was Dine-In
    if (order.tableId) {
      const Table = require("../models/Table");
      await Table.findByIdAndUpdate(order.tableId, {
        status: "Available",
        currentOrderId: null,
      });
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

module.exports = { createOrder, getOrderById, updateOrderStatus };
