const Subscription = require('../models/Subscription');
const User = require('../models/User');

// @desc    Get Current Subscription Details
// @route   GET /api/subscription/current
// @access  Private (Owner)
const getCurrentSubscription = async (req, res) => {
  try {
    // 1. Look for a formal subscription in the DB
    let sub = await Subscription.findOne({ restaurantId: req.user.restaurantId });

    const today = new Date();

    // 2. If no formal subscription exists yet, they are on the default 10-Day Trial
    if (!sub) {
      const accountCreationDate = new Date(req.user.createdAt || Date.now());
      const trialEndDate = new Date(accountCreationDate);
      trialEndDate.setDate(trialEndDate.getDate() + 10); // Add 10 days

      const daysLeft = Math.max(0, Math.ceil((trialEndDate - today) / (1000 * 60 * 60 * 24)));

      return res.json({
        plan: 'Basic Trial',
        status: daysLeft > 0 ? 'Active' : 'Expired',
        startDate: accountCreationDate,
        endDate: trialEndDate,
        daysLeft: daysLeft
      });
    }

    // 3. If they DO have a formal subscription (Pro Plan)
    const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate) - today) / (1000 * 60 * 60 * 24)));
    
    // Auto-update status to expired if days run out
    if (daysLeft === 0 && sub.status === 'Active') {
      sub.status = 'Expired';
      await sub.save();
    }

    res.json({
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      daysLeft: daysLeft
    });

  } catch (error) {
    console.error("Subscription Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
};

module.exports = { getCurrentSubscription };