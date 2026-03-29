const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

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
    // 1. Create the SaaS Tenant (The Restaurant)
    const restaurant = await Restaurant.create({
      name: restaurantName,
      ownerName,
      email,
      phone,
      address,
      plan: plan || "Basic",
      trialStartDate: new Date(),
      trialEndDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 Day Trial
      isActive: true,
    });

    // 2. Hash the default password for the new Owner
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the Owner Account linked to this new Restaurant
    const owner = await User.create({
      restaurantId: restaurant._id, // Links them to the vault!
      name: ownerName,
      email: email,
      password: hashedPassword,
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
    res
      .status(500)
      .json({ message: "Failed to create restaurant. Email might be taken." });
  }
};

// @desc    Lock/Unlock a Restaurant (If they don't pay)
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

module.exports = {
  getAllRestaurants,
  createRestaurant,
  toggleRestaurantStatus,
  updateRestaurantPlan,
};
