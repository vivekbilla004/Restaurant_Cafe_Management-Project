const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          message: "User not found. Please log out and log in again.",
        });
      }

      if (!req.user.restaurantId && decoded.restaurantId) {
        req.user.restaurantId = decoded.restaurantId;
      }

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Not authorized: Token failed or expired." });
    }
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized: No token provided." });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. If req.user is missing because 'protect' wasn't put in the route, catch it SAFELY!
    if (!req.user) {
      return res.status(401).json({
        message:
          "Server Configuration Error: 'protect' middleware is missing from this route.",
      });
    }

    // 2. Check the role safely
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) is not authorized to access this route.`,
      });
    }

    next();
  };
};
const checkSubscription = async (req, res, next) => {
  // 🔥 MUST BE ASYNC NOW
  try {
    // 1. Safety Check
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized. User data missing." });
    }

    // 2. GOD MODE: SuperAdmins get a free pass to everything
    if (req.user.role === "SuperAdmin") {
      return next();
    }

    // 3. THE SAAS CHECK: Fetch the Restaurant, not the User
    const restaurant = await Restaurant.findById(req.user.restaurantId);

    if (!restaurant) {
      return res
        .status(404)
        .json({ message: "Restaurant account not found in system." });
    }

    // 4. Manual Lockout Check (If SuperAdmin disabled them)
    if (!restaurant.isActive) {
      return res.status(403).json({
        message:
          "ACCOUNT LOCKED: Your subscription was deactivated. Please contact Omicra Support.",
      });
    }

    // 5. The Trial Expiration Check
    const today = new Date();
    // Assuming you set trialEndDate when creating the restaurant
    const trialEnd = new Date(restaurant.trialEndDate || restaurant.createdAt);

    // Add 14 days to creation date if trialEndDate isn't explicitly set
    if (!restaurant.trialEndDate) {
      trialEnd.setDate(trialEnd.getDate() + 14);
    }

    const isPaid = restaurant.plan === "Pro";
    const isExpired = today > trialEnd && !isPaid;

    if (isExpired) {
      return res.status(402).json({
        message: "Your Omicra trial has expired. Please upgrade to Pro.",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    // 6. If they are paid, or still in trial, let them pass!
    next();
  } catch (error) {
    console.error("Subscription Check Error:", error);
    res
      .status(500)
      .json({ message: "Server error checking subscription status." });
  }
};

module.exports = { protect, authorize, checkSubscription };
