const express = require('express');
const router = express.Router();
const { createTable, getTables, updateTableStatus , reserveTable ,mergeTables } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Read Access: Everyone (Waiters, Cashiers, Kitchen, Managers, Owners)
router.get('/', protect, getTables);

// Status Update Access: Everyone (Waiters need to mark tables Occupied )
router.put('/:id/status', protect, updateTableStatus);

// Write Access: Strictly Owners and Managers
router.post('/', protect, authorize('Owner', 'Manager'), createTable);

// Reservation Access: Everyone (Waiters need to reserve tables for customers)
router.put('/:id/reserve', protect, reserveTable)

// Merge Access: Strictly Owners and Managers (For combining tables during large parties)
router.post('/merge', protect, mergeTables)

module.exports = router;