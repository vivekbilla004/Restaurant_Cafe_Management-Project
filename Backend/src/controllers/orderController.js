const Order = require("../models/Order");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");
const { deductInventoryForOrder } = require("./inventoryController");

// @desc    Create new order & order items
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const {
    tableId,
    orderType,
    items,
    discount = 0,
    tax = 0,
    paymentMode = "Pending",
    splitPayments = [],
  } = req.body;

  if (!items || items.length === 0)
    return res.status(400).json({ message: "No order items provided" });

  try {
    let calculatedTotalAmount = 0;
    const verifiedItems = [];

    // 1. Verify and Snapshot items from DB
    for (const item of items) {
      const menuItem = await MenuItem.findOne({
        _id: item.menuItemId,
        restaurantId: req.user.restaurantId,
      });
      if (!menuItem)
        return res.status(404).json({ message: `Menu item not found` });

      const itemTotal = menuItem.price * item.quantity;
      calculatedTotalAmount += itemTotal;

      verifiedItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name, // 🔥 SNAPSHOT: Name secured
        price: menuItem.price, // 🔥 SNAPSHOT: Price secured
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    const finalAmount = calculatedTotalAmount - discount + tax;

    // 2. Create the Order Document with embedded items
    const order = await Order.create({
      restaurantId: req.user.restaurantId,
      tableId: orderType === "DineIn" ? tableId : null,
      orderType,
      items: verifiedItems,
      totalAmount: calculatedTotalAmount,
      discount,
      tax,
      finalAmount,
      paymentMode,
      splitPayments: paymentMode === "Split" ? splitPayments : [],
      status: "Pending",
      paymentStatus: paymentMode !== "Pending" ? "Paid" : "Unpaid",
      createdBy: req.user._id,
    });

    // 3. Lock Table immediately for DineIn
    if (orderType === "DineIn" && tableId) {
      await Table.findOneAndUpdate(
        { _id: tableId, restaurantId: req.user.restaurantId },
        { status: "Occupied" },
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

// @desc    Get all orders (Clean NoSQL approach)
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.restaurantId })
      .populate("tableId", "tableNumber capacity")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
};

// @desc    Get single order details
const getOrderById = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  })
    .populate("tableId", "tableNumber")
    .populate("createdBy", "name");

  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ order });
};

// @desc    Update Order Status & Trigger Inventory
const updateOrderStatus = async (req, res) => {
  const { status, paymentStatus, paymentMode } = req.body;
  const order = await Order.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  });

  if (!order) return res.status(404).json({ message: "Order not found" });

  const previousStatus = order.status;
  if (status) order.status = status;

  // Auto-Deduct Inventory logic
  if (status === "Preparing" && previousStatus !== "Preparing") {
    await deductInventoryForOrder(order._id, req.user.restaurantId);
  }

  // Handle Payment & Freeing the Table
  if (paymentStatus === "Paid") {
    order.paymentStatus = "Paid";
    order.paymentMode = paymentMode || order.paymentMode;

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: "Available",
        currentOrderId: null,
      });
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

// @desc    Get Kitchen Orders (Lightning Fast now due to embedded items)
const getKitchenOrders = async (req, res) => {
  try {
    const activeOrders = await Order.find({
      restaurantId: req.user.restaurantId,
      status: { $in: ["Pending", "Received", "Preparing", "Ready"] },
    })
      .populate("tableId", "tableNumber")
      .sort({ createdAt: 1 });

    res.json(activeOrders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch kitchen orders" });
  }
};

// @desc    Update Kitchen Order Status
// @desc    Update Kitchen Order Status & Trigger Inventory
// @route   PUT /api/orders/:id/kitchen-status
// @access  Private (Owner, Manager, Kitchen)
const updateKitchenStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Preparing", "Ready"].includes(status)) {
      return res
        .status(403)
        .json({
          message: "Kitchen can only mark orders as Preparing or Ready.",
        });
    }

    // 1. Find the order FIRST so we can check its previous status
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    }).populate("tableId", "tableNumber");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const previousStatus = order.status;
    order.status = status;

    // 🔥 THE LOOPHOLE FIX: Trigger Auto-Deduct when the Chef starts cooking!
    if (status === "Preparing" && previousStatus !== "Preparing") {
      await deductInventoryForOrder(order._id, req.user.restaurantId);
    }

    // Save the order to the database
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Kitchen Status Update Error:", error.message);
    res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};

// @desc    Get the running (Unpaid) order for a specific table
// @route   GET /api/orders/table/:tableId
// @access  Private
const getRunningOrderByTable = async (req, res) => {
  try {
    const order = await Order.findOne({
      tableId: req.params.tableId,
      restaurantId: req.user.restaurantId,
      paymentStatus: "Unpaid", // Only look for running orders
    });

    if (!order)
      return res
        .status(404)
        .json({ message: "No running order found for this table" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching table order" });
  }
};

// @desc    Settle an Unpaid Order & Clear the Table
// @route   PUT /api/orders/:id/settle
// @access  Private (Cashier, Manager, Owner)
const settleOrder = async (req, res) => {
  const { paymentMode, splitPayments, discount, tax, finalAmount } = req.body;

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus === "Paid")
      return res.status(400).json({ message: "Order already paid" });

    // Update the financials and mark as Paid
    order.paymentStatus = "Paid";
    order.paymentMode = paymentMode;
    order.splitPayments = paymentMode === "Split" ? splitPayments : [];

    // Optional: Allow cashier to apply last-minute discounts
    if (discount !== undefined) {
      order.discount = discount;
      order.tax = tax;
      order.finalAmount = finalAmount;
    }

    await order.save();

    // 🔥 LOOPHOLE 1 COMPLETELY CLOSED: The software clears the table automatically
    if (order.tableId) {
      const Table = require("../models/Table");
      await Table.findByIdAndUpdate(order.tableId, { status: "Available" });
    }

    res.json({ message: "Bill Settled and Table Cleared", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to settle bill", error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getKitchenOrders,
  updateKitchenStatus,
  settleOrder,
  getRunningOrderByTable,
};
