const express = require('express');
const router = express.Router();
const { createTable, getTables, updateTableStatus } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Read Access: Everyone (Waiters, Cashiers, Kitchen, Managers, Owners)
router.get('/', protect, getTables);

// Status Update Access: Everyone (Waiters need to mark tables Occupied )
router.put('/:id/status', protect, updateTableStatus);

// Write Access: Strictly Owners and Managers
router.post('/', protect, authorize('Owner', 'Manager'), createTable);

module.exports = router;