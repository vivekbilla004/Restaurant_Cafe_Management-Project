const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

// @desc    Get all Omicra Clients (Restaurants) & basic revenue stats
// @route   GET /api/admin/restaurants
// @access  Private (SuperAdmin)
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch clients" });
  }
};

// @desc    Onboard a new Restaurant & Create their Owner Account
// @route   POST /api/admin/restaurants
// @access  Private (SuperAdmin)
const createRestaurant = async (req, res) => {
  const { restaurantName, ownerName, email, phone, address, plan, password } =
    req.body;

  try {
    // 🔥 FIX 1: Early Exit. Check if email exists BEFORE creating the restaurant
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email is already registered to another user." });
    }

    // 1. Create the SaaS Tenant (The Restaurant)
    const restaurant = await Restaurant.create({
      name: restaurantName,
      ownerName,
      email,
      phone,
      address,
      plan: plan || "Basic",
      trialStartDate: new Date(),
      trialEndDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 🔥 FIX 2: 30 Day Trial
      isActive: true,
    });

    // 2. Create the Owner Account
    // 🔥 FIX 3: Pass plain text password! Your User.js model's pre('save') hook will safely hash it once.
    const owner = await User.create({
      restaurantId: restaurant._id,
      name: ownerName,
      email: email,
      password: password,
      role: "Owner",
      isActive: true,
    });

    res.status(201).json({
      message: "Restaurant and Owner created successfully",
      restaurant,
      ownerEmail: owner.email,
    });
  } catch (error) {
    console.error("Client Creation Error:", error);
    res.status(500).json({ message: "Failed to create restaurant." });
  }
};

// @desc    Lock/Unlock a Restaurant
// @route   PUT /api/admin/restaurants/:id/status
// @access  Private (SuperAdmin)
const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json({
      message: `Restaurant ${restaurant.name} is now ${restaurant.isActive ? "Active" : "Locked"}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// @desc    Upgrade or Downgrade Subscription Plan
// @route   PUT /api/admin/restaurants/:id/plan
// @access  Private (SuperAdmin)
const updateRestaurantPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!["Basic", "Pro"].includes(plan))
      return res.status(400).json({ message: "Invalid Plan" });

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $set: { plan } },
      { new: true },
    );

    res.json({ message: `Plan updated to ${plan}`, restaurant });
  } catch (error) {
    res.status(500).json({ message: "Failed to update plan" });
  }
};

// @desc    Broadcast message to all tenants
// @route   PUT /api/admin/broadcast
// @access  Private (SuperAdmin)
const broadcastMessage = async (req, res) => {
  try {
    const { message, clear } = req.body;
    const update = clear
      ? { $unset: { systemMessage: "" } }
      : { $set: { systemMessage: message } };

    await Restaurant.updateMany({}, update);
    res.json({
      message: clear
        ? "System messages cleared."
        : "Broadcast sent to all clients!",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to broadcast message" });
  }
};

module.exports = {
  getAllRestaurants,
  createRestaurant,
  toggleRestaurantStatus,
  updateRestaurantPlan,
  broadcastMessage,
};
