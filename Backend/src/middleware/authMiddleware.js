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

module.exports = { protect, authorize };