const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, restaurantId, role) => {
  return jwt.sign({ id, restaurantId, role }, process.env.JWT_SECRET, { expiresIn: '12h' }); // Shorter expiry for security [cite: 384]
};

// @desc    Auth user & get token
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });
    
    res.json({
      _id: user._id, // This _id will be saved as 'createdBy' in the Orders module later 
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      token: generateToken(user._id, user.restaurantId, user.role),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// @desc    Create a new system user (Login Access)
// @route   POST /api/users
// @access  Private (Owner/Manager Only)
const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already in use' });

    // Multi-tenant check: Auto-assign the creator's restaurantId
    const user = await User.create({
        restaurantId: req.user.restaurantId, 
        name,
        email,
        password,
        role
    });

    if (user) {
        // NOTE: In the future, this could trigger an event to also create a record 
        // in the 'Staff' collection for salary tracking .
        res.status(201).json({ message: 'User access created successfully', userId: user._id });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
}

// @desc    Toggle user active status (instead of hard deleting)
// @route   PUT /api/users/:id/status
// @access  Private (Owner Only)
const toggleUserStatus = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    
    if (user) {
        user.isActive = !user.isActive; // 
        await user.save();
        res.json({ message: `User status changed to ${user.isActive ? 'Active' : 'Inactive'}` });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
}

module.exports = { loginUser, createUser, toggleUserStatus };