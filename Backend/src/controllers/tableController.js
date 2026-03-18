const Table = require('../models/Table');

// @desc    Create a new Table
// @route   POST /api/tables
// @access  Private (Owner/Manager)
const createTable = async (req, res) => {
  const { tableNumber, capacity } = req.body;

  try {
    const table = await Table.create({
      restaurantId: req.user.restaurantId,
      tableNumber,
      capacity
    });
    res.status(201).json(table);
  } catch (error) {
    // Catches the unique index error if they try to add "Table 1" twice
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Table number already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all tables for the restaurant (for POS / Floor Plan)
// @route   GET /api/tables
// @access  Private (All Roles)
const getTables = async (req, res) => {
  const tables = await Table.find({ restaurantId: req.user.restaurantId }).sort({ tableNumber: 1 });
  res.json(tables);
};

// @desc    Update Table Status (Available, Occupied, Reserved)
// @route   PUT /api/tables/:id/status
// @access  Private (All Roles - Waiters need this)
const updateTableStatus = async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['Available', 'Occupied', 'Reserved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const table = await Table.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });

  if (table) {
    table.status = status;
    await table.save();
    res.json(table);
  } else {
    res.status(404).json({ message: 'Table not found' });
  }
};

module.exports = { createTable, getTables, updateTableStatus };