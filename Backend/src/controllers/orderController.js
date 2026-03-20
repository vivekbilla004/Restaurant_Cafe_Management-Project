const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");
const { deductInventoryForOrder } = require('./inventoryController');

// @desc    Create new order & order items
// @route   POST /api/orders
// @access  Private 
const createOrder = async (req, res) => {
  const { tableId, orderType, items, discount = 0, tax = 0, paymentMode = "Pending" } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ message: "No order items provided" });

  try {
    let calculatedTotalAmount = 0;
    const orderItemsToInsert = [];

    for (const item of items) {
      const menuItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId: req.user.restaurantId });
      if (!menuItem) return res.status(404).json({ message: `Menu item not found` });

      const itemTotal = menuItem.price * item.quantity;
      calculatedTotalAmount += itemTotal;

      orderItemsToInsert.push({
        menuItemId: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
        total: itemTotal,
      });
    }

    const finalAmount = calculatedTotalAmount - discount + tax;

    const order = await Order.create({
      restaurantId: req.user.restaurantId,
      tableId: orderType === "DineIn" ? tableId : null,
      orderType,
      totalAmount: calculatedTotalAmount,
      discount,
      tax,
      finalAmount,
      paymentMode,
      status: "Pending", 
      createdBy: req.user._id, 
    });

    const preparedOrderItems = orderItemsToInsert.map((item) => ({ ...item, orderId: order._id }));
    await OrderItem.insertMany(preparedOrderItems);

    if (orderType === "DineIn" && tableId) {
      await Table.findOneAndUpdate(
        { _id: tableId, restaurantId: req.user.restaurantId },
        { status: "Occupied", currentOrderId: order._id }, 
      );
    }

    res.status(201).json({ message: "Order created successfully", orderId: order._id });
  } catch (error) {
    res.status(500).json({ message: "Error processing order", error: error.message });
  }
};

// --- LOOPHOLE 1 FIXED: MISSING ROUTE FOR KOT ---
// @desc    Get all orders (Used by KOT to display active tickets)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    // 1. Fetch all orders for this restaurant (newest first)
    const orders = await Order.find({ restaurantId: req.user.restaurantId })
      .populate("tableId", "tableNumber capacity")
      .sort({ createdAt: -1 });

    // 2. Fetch all related order items so the KOT can display the dish names
    const orderIds = orders.map(o => o._id);
    const orderItems = await OrderItem.find({ orderId: { $in: orderIds } })
      .populate("menuItemId", "name price image");

    // 3. Attach the items array directly into the order object for the frontend
    const populatedOrders = orders.map(order => {
      return {
        ...order.toObject(),
        items: orderItems.filter(item => item.orderId.toString() === order._id.toString())
      };
    });

    res.json(populatedOrders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId })
    .populate("tableId", "tableNumber")
    .populate("createdBy", "name");

  if (!order) return res.status(404).json({ message: "Order not found" });
  const orderItems = await OrderItem.find({ orderId: order._id }).populate("menuItemId", "name image");

  res.json({ order, orderItems });
};

// @desc    Update Order Status & Trigger Inventory
// @route   PUT /api/orders/:id/status
// @access  Private 
const updateOrderStatus = async (req, res) => {
  const { status, paymentStatus, paymentMode } = req.body;
  const order = await Order.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });

  if (!order) return res.status(404).json({ message: "Order not found" });

  // --- LOOPHOLE 2 FIXED: LOGIC BOMB IN AUTO-DEDUCT ---
  // We MUST save the old status before updating it, otherwise the check fails!
  const previousStatus = order.status; 
  
  if (status) order.status = status;

  // Now it properly compares the NEW status against the OLD status
  if (status === 'Preparing' && previousStatus !== 'Preparing') {
    await deductInventoryForOrder(order._id, req.user.restaurantId);
  }

  // Handle Payment Completion
  if (paymentStatus === "Paid") {
    order.paymentStatus = "Paid";
    order.paymentMode = paymentMode || order.paymentMode;

    if (order.tableId) {
      const Table = require("../models/Table");
      await Table.findByIdAndUpdate(order.tableId, { status: "Available", currentOrderId: null });
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// Make sure getOrders is exported!
module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };