const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // FIX: Import bcryptjs

const generateToken = (id, restaurantId, role) => {
  return jwt.sign({ id, restaurantId, role }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

// @desc    Register Restaurant, Start Trial & Create Owner Account
// @route   POST /api/restaurants/register
// @access  Public
const registerRestaurant = async (req, res) => {
  const { restaurantName, ownerName, email, phone, address, password } = req.body;
  console.log("Registration Request:", req.body);

  try {
    const restaurantExists = await Restaurant.findOne({ email });
    if (restaurantExists) return res.status(400).json({ message: 'Restaurant already exists' });

    // 1. Calculate Trial Dates [cite: 205, 424]
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialStart.getDate() + 30);

    // 2. Create Restaurant Tenant [cite: 16-38]
    const restaurant = await Restaurant.create({
      name: restaurantName,
      ownerName,
      email,
      phone,
      address,
      plan: 'Basic',
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
      isActive: true
    });

    // 3. Create Subscription Record 
    await Subscription.create({
      restaurantId: restaurant._id,
      plan: 'Basic',
      startDate: trialStart,
      endDate: trialEnd,
      status: 'Active'
    });

    // FIX: Hash the password securely before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create Owner User [cite: 3-13]
    const ownerUser = await User.create({
      restaurantId: restaurant._id,
      name: ownerName,
      email: email, 
      password: password, // FIX: Use the securely hashed password
      role: 'Owner',
      isActive: true // FIX: Ensure the account is active for login
    });

    res.status(201).json({
      message: 'SaaS Onboarding Complete. 30-Day Trial Active!',
      restaurantId: restaurant._id,
      user: {
        _id: ownerUser._id,
        name: ownerUser.name,
        role: ownerUser.role,
        token: generateToken(ownerUser._id, restaurant._id, ownerUser.role)
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// @desc    Update Restaurant Settings
// @route   PUT /api/restaurants/profile
// @access  Private (Owner Only)
const updateRestaurantProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  
  // Strict Multi-Tenant filter: Ensure they can only update THEIR restaurant [cite: 172]
  const restaurant = await Restaurant.findById(req.user.restaurantId);

  if (restaurant) {
    restaurant.name = name || restaurant.name;
    restaurant.phone = phone || restaurant.phone;
    restaurant.address = address || restaurant.address;

    const updatedRestaurant = await restaurant.save();
    res.json(updatedRestaurant);
  } else {
    res.status(404).json({ message: 'Restaurant not found' });
  }
};

module.exports = { registerRestaurant, updateRestaurantProfile };