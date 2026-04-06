const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const Recipe = require("../models/Recipe");
const Notification = require("../models/Notification");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");
const { deductInventoryForOrder } = require("./inventoryController");

// @desc    Create new order & order items
// @route   POST /api/orders
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
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    const finalAmount = calculatedTotalAmount - discount + tax;

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

// @desc    Get all orders
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
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    })
      .populate("tableId", "tableNumber")
      .populate("createdBy", "name");

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order" });
  }
};

// @desc    Update Order Status & Trigger Inventory
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus, paymentMode } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    const previousStatus = order.status;
    if (status) order.status = status;

    if (status === "Preparing" && previousStatus !== "Preparing") {
      await deductInventoryForOrder(order._id, req.user.restaurantId);
    }

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
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};

// @desc    Get Kitchen Orders
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

// @desc    Update Kitchen Order Status & Trigger Inventory Logic
const updateKitchenStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const restaurantId = req.user.restaurantId;

    const order = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Inventory Deduction Logic
    if (status === "Preparing" && order.status !== "Preparing") {
      const requiredMaterials = {};

      for (const item of order.items) {
        const recipes = await Recipe.find({
          menuItemId: item.menuItemId,
          restaurantId,
          isActive: true,
        });

        for (const recipe of recipes) {
          const totalNeeded = recipe.requiredQty * item.quantity;
          if (!requiredMaterials[recipe.inventoryId]) {
            requiredMaterials[recipe.inventoryId] = 0;
          }
          requiredMaterials[recipe.inventoryId] += totalNeeded;
        }
      }

      const inventoryItems = await Inventory.find({
        _id: { $in: Object.keys(requiredMaterials) },
        restaurantId,
      });

      // Check stock levels
      for (const invItem of inventoryItems) {
        const needed = requiredMaterials[invItem._id];
        if (invItem.quantity < needed) {
          await Notification.create({
            restaurantId,
            title: "CRITICAL: Out of Stock",
            message: `Kitchen tried to cook Order #${order._id.toString().slice(-4)} but ran out of ${invItem.name}.`,
            type: "OutOfStock",
          });

          return res.status(400).json({
            code: "OUT_OF_STOCK",
            message: `Not enough ${invItem.name}. Need ${needed}, have ${invItem.quantity}.`,
          });
        }
      }

      // Deduct stock
      for (const invItem of inventoryItems) {
        const needed = requiredMaterials[invItem._id];
        invItem.quantity -= needed;
        await invItem.save();

        const minimumLevel = invItem.minStockLevel || 5;
        if (invItem.quantity <= minimumLevel && invItem.quantity > 0) {
          const existingAlert = await Notification.findOne({
            restaurantId,
            type: "LowStock",
            title: { $regex: invItem.name },
            isRead: false,
          });

          if (!existingAlert) {
            await Notification.create({
              restaurantId,
              title: "Low Stock Alert",
              message: `${invItem.name} is running low.`,
              type: "LowStock",
            });
          }
        }
      }
    }

    order.status = status;
    await order.save();
    res.json({ message: `Order marked as ${status}`, order });
  } catch (error) {
    console.error("Kitchen Status Error:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// @desc    Get the running (Unpaid) order for a specific table
const getRunningOrderByTable = async (req, res) => {
  try {
    const order = await Order.findOne({
      tableId: req.params.tableId,
      restaurantId: req.user.restaurantId,
      paymentStatus: "Unpaid",
    });

    if (!order)
      return res.status(404).json({ message: "No running order found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching table order" });
  }
};

// @desc    Settle an Unpaid Order & Clear the Table
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

    order.paymentStatus = "Paid";
    order.paymentMode = paymentMode;
    order.splitPayments = paymentMode === "Split" ? splitPayments : [];

    if (discount !== undefined) {
      order.discount = discount;
      order.tax = tax;
      order.finalAmount = finalAmount;
    }

    await order.save();

    if (order.tableId) {
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
