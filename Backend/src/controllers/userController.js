const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

const generateToken = (id, restaurantId, role) => {
  return jwt.sign({ id, restaurantId, role }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    // 1. Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found in database.");
      return res
        .status(401)
        .json({ message: "Invalid credentials - User not found" });
    }

    // FIX 2: Use bcrypt.compare directly. This ALWAYS works.
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      if (!user.isActive) {
        return res.status(403).json({ message: "Account disabled" });
      }

      console.log("Login successful! Generating token...");
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        token: generateToken(user._id, user.restaurantId, user.role),
      });
    } else {
      console.log("Password did not match the database hash.");
      res.status(401).json({ message: "Invalid credentials - Wrong password" });
    }
  } catch (error) {
    console.error("Login Server Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Create a new system user (Login Access)
// @route   POST /api/users
// @access  Private (Owner/Manager Only)
const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log(req.body);

  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: "Email already in use" });

  // Multi-tenant check: Auto-assign the creator's restaurantId
  const user = await User.create({
    restaurantId: req.user.restaurantId,
    name,
    email,
    password,
    role,
  });

  if (user) {
    // NOTE: In the future, this could trigger an event to also create a record
    // in the 'Staff' collection for salary tracking .
    res
      .status(201)
      .json({ message: "User access created successfully", userId: user._id });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Toggle user active status (instead of hard deleting)
// @route   PUT /api/users/:id/status
// @access  Private (Owner Only)
const toggleUserStatus = async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  });

  if (user) {
    user.isActive = !user.isActive; //
    await user.save();
    res.json({
      message: `User status changed to ${user.isActive ? "Active" : "Inactive"}`,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

module.exports = { loginUser, createUser, toggleUserStatus };
