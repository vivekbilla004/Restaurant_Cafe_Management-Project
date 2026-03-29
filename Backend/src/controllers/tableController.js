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
    if (error.code === 11000) {
      return res.status(400).json({ message: "Table number already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all tables for the restaurant
// @route   GET /api/tables
// @access  Private (All Roles)
const getTables = async (req, res) => {
  const tables = await Table.find({ restaurantId: req.user.restaurantId }).sort(
    { tableNumber: 1 },
  );
  res.json(tables);
};

// @desc    Update Table Status
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
    // FIX: If the table becomes available or occupied, wipe the reservation data!
    if (status === "Available" || status === "Occupied") {
      table.reservationName = null;
      table.reservationTime = null;
    }
    await table.save();
    res.json(table);
  } else {
    res.status(404).json({ message: "Table not found" });
  }
};

// @desc    Reserve a Table
// @route   PUT /api/tables/:id/reserve
// @access  Private (All Roles - Waiters need this)
const reserveTable = async (req, res) => {
  try {
    const { reservationName, reservationTime } = req.body;

    // Fixes the date parsing crash
    const parsedDate = new Date(reservationTime);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Invalid Date format sent from frontend." });
    }

    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { 
        $set: { 
          status: "Reserved",
          reservationName: reservationName,
          reservationTime: parsedDate
        } 
      },
      { new: true }
    );

    if (!table) return res.status(404).json({ message: "Table not found" });
    
    res.json(table);
  } catch (error) {
    console.error("Reservation Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Merge Multiple Tables
// @route   POST /api/tables/merge
// @access  Private (Owner/Manager ONLY)
const mergeTables = async (req, res) => {
  const { tableIds } = req.body;

  if (!tableIds || tableIds.length < 2) {
    return res
      .status(400)
      .json({ message: "Select at least two tables to merge" });
  }

  const primaryTableId = tableIds[0];
  const secondaryTableIds = tableIds.slice(1);

  // FIX: Added restaurantId to ensure they only merge THEIR OWN tables
  await Table.findOneAndUpdate(
    { _id: primaryTableId, restaurantId: req.user.restaurantId },
    { $addToSet: { mergedWith: { $each: secondaryTableIds } } },
  );

  await Table.updateMany(
    { _id: { $in: secondaryTableIds }, restaurantId: req.user.restaurantId },
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
