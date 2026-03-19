const Table = require("../models/Table");

// @desc    Create a new Table
// @route   POST /api/tables
// @access  Private (Owner/Manager)
const createTable = async (req, res) => {
  const { tableNumber, capacity } = req.body;

  try {
    const table = await Table.create({
      restaurantId: req.user.restaurantId,
      tableNumber,
      capacity,
    });
    res.status(201).json(table);
  } catch (error) {
    // Catches the unique index error if they try to add "Table 1" twice
    if (error.code === 11000) {
      return res.status(400).json({ message: "Table number already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all tables for the restaurant (for POS / Floor Plan)
// @route   GET /api/tables
// @access  Private (All Roles)
const getTables = async (req, res) => {
  const tables = await Table.find({ restaurantId: req.user.restaurantId }).sort(
    { tableNumber: 1 },
  );
  res.json(tables);
};

// @desc    Update Table Status (Available, Occupied, Reserved)
// @route   PUT /api/tables/:id/status
// @access  Private (All Roles - Waiters need this)
const updateTableStatus = async (req, res) => {
  const { status } = req.body;

  const validStatuses = ["Available", "Occupied", "Reserved"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const table = await Table.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  });

  if (table) {
    table.status = status;
    await table.save();
    res.json(table);
  } else {
    res.status(404).json({ message: "Table not found" });
  }
};

// @desc    Reserve a Table with Name & Time (For Reservations)
// @route   PUT /api/tables/:id/reserve
// @access  Private (All Roles - Waiters need this)
const reserveTable = async (req, res) => {
  const { reservationName, reservationTime } = req.body;
  const table = await Table.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  });

  if (table) {
    table.status = "Reserved";
    table.reservationName = reservationName;
    table.reservationTime = reservationTime;
    await table.save();
    res.json(table);
  } else {
    res.status(404).json({ message: "Table not found" });
  }
};

// @desc    Merge Multiple Tables
// @route   POST /api/tables/merge
const mergeTables = async (req, res) => {
  const { tableIds } = req.body; // Array of table IDs to merge

  if (!tableIds || tableIds.length < 2) {
    return res
      .status(400)
      .json({ message: "Select at least two tables to merge" });
  }

  // Find the primary table (the first one selected)
  const primaryTableId = tableIds[0];
  const secondaryTableIds = tableIds.slice(1);

  // Update the primary table to link to the secondary tables
  await Table.findByIdAndUpdate(primaryTableId, {
    $addToSet: { mergedWith: { $each: secondaryTableIds } },
  });

  // Update secondary tables to point back to the primary table
  await Table.updateMany(
    { _id: { $in: secondaryTableIds } },
    { $set: { mergedWith: [primaryTableId] } },
  );

  res.json({ message: "Tables merged successfully" });
};

module.exports = {
  createTable,
  getTables,
  updateTableStatus,
  reserveTable,
  mergeTables,
};
