const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Authentication (Who are you?)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if(!req.user.restaurantId) {
          return res.status(401).json({ message: 'Tenant ID missing. Access Denied.' });
      }
      // Loophole closed: Ensure the user's account hasn't been deactivated
      if(!req.user.isActive) {
          return res.status(403).json({ message: 'Account deactivated. Contact Owner.' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};

// 2. Authorization (What are you allowed to do?)
// Example usage in future routes: router.get('/reports', protect, authorize('Owner', 'Manager'), getReports);
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not authorized to access this resource.` 
      });
    }
    next();
  };
};

const checkSubscription = (req, res, next) => {
  try {
    // 1. Safety Check: Ensure the 'protect' middleware ran first
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized. User data missing.' });
    }

    // 2. SuperAdmins get a free pass to everything
    if (req.user.role === 'SuperAdmin') {
      return next();
    }

    // 3. The 10-Day Trial Math (Exactly the same as the frontend)
    const accountCreationDate = new Date(req.user.createdAt || Date.now());
    const today = new Date();
    
    const timeDifference = today.getTime() - accountCreationDate.getTime();
    const daysActive = Math.floor(timeDifference / (1000 * 3600 * 24));

    // 4. The Lock Condition
    const isPaid = req.user.subscriptionStatus === 'Pro';
    const isExpired = daysActive >= 10 && !isPaid;

    if (isExpired) {
      // 402 is the official HTTP status code for "Payment Required"
      return res.status(402).json({ 
        message: 'Your 10-Day Omicra trial has expired. Please upgrade to Pro to use this feature.',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // 5. If they are paid, or still in the 10-day trial, let them pass!
    next();

  } catch (error) {
    console.error("Subscription Check Error:", error);
    res.status(500).json({ message: 'Server error checking subscription status.' });
  }
};

module.exports = { protect, authorize, checkSubscription };