const express = require('express');
const router = express.Router();
const { registerRestaurant, updateRestaurantProfile } = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerRestaurant);

// Only the Owner can update the core business details
router.put('/profile', protect, authorize('Owner'), updateRestaurantProfile);

module.exports = router;