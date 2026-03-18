const express = require('express');
const router = express.Router();
const { loginUser, createUser, toggleUserStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public
router.post('/login', loginUser);

// Protected & Authorized 
// Only Owners and Managers can create new user logins
router.post('/', protect, authorize('Owner', 'Manager'), createUser); 

// Only Owners can activate/deactivate accounts
router.put('/:id/status', protect, authorize('Owner'), toggleUserStatus);

module.exports = router;