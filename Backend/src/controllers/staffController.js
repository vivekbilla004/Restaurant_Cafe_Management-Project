const Staff = require("../models/Staff");
const Expense = require("../models/Expense");
const User = require("../models/User");

// @desc    Add a new Staff Member
// @route   POST /api/staff
// @access  Private (Owner/Manager)
const addStaff = async (req, res) => {
  try {
    const { name, role, salary, phone, email, password } = req.body;

    // Safety Check: If they provided an email, ensure it isn't already used
    if (email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Email is already registered. Choose another.' });
      }
    }

    // Create the HR / Payroll Record
    const staff = await Staff.create({
      restaurantId: req.user.restaurantId,
      name,
      role, 
      salary: Number(salary),
      phone: phone || 'N/A'
    });

    let loginCreated = false;
    
    // Create the Login Account in the User Collection
    if (email && password) {
      await User.create({
        restaurantId: req.user.restaurantId,
        name,
        email,
        password, 
        role
      });
      loginCreated = true;
      
      // Save the email to the staff record so we can delete their login later if they are fired
      staff.email = email;
      await staff.save();
    }

    res.status(201).json({ 
      message: loginCreated ? 'Staff and Login created successfully!' : 'Staff created (No login access)', 
      staff,
      loginCreated
    });

  } catch (error) {
    console.error("Add Staff Error:", error);
    res.status(500).json({ message: "Failed to add staff", error: error.message });
  }
};

// @desc    Mark Daily Attendance
// @route   POST /api/staff/:id/attendance
// @access  Private (Owner/Manager)
const markAttendance = async (req, res) => {
  const { date, status } = req.body;
  const staff = await Staff.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });

  if (!staff) return res.status(404).json({ message: "Staff member not found" });

  const normalizedDate = new Date(date).setHours(0, 0, 0, 0);
  const existingRecord = staff.attendance.find(a => new Date(a.date).setHours(0, 0, 0, 0) === normalizedDate);

  if (existingRecord) {
    existingRecord.status = status; 
  } else {
    staff.attendance.push({ date: new Date(date), status });
  }

  await staff.save();
  res.json({ message: "Attendance recorded", staff });
};

// @desc    Get Staff & Calculate Estimated Monthly Salary
// @route   GET /api/staff
// @access  Private (Owner/Manager)
const getStaffList = async (req, res) => {
  const staffMembers = await Staff.find({ restaurantId: req.user.restaurantId, isActive: true });
  const currentMonth = new Date().getMonth();

  const staffWithStats = staffMembers.map((staff) => {
    const daysPresent = staff.attendance.filter(
      (a) => a.status === "Present" && new Date(a.date).getMonth() === currentMonth,
    ).length;

    return {
      ...staff._doc,
      daysPresentThisMonth: daysPresent,
      estimatedPayout: Math.round((staff.salary / 30) * daysPresent),
    };
  });

  res.json(staffWithStats);
};

// @desc    Process Monthly Payroll & Create Expense Record
// @route   POST /api/staff/:id/payroll
// @access  Private (Owner)
const processPayroll = async (req, res) => {
  try {
    const { month, year } = req.body; // 🔥 LOOPHOLE 2: We ignore payoutAmount from the frontend entirely!

    const staff = await Staff.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // 🔥 LOOPHOLE 2 & 4: STRICT BACKEND MATH (Fixes the "Absent" bug)
    // We explicitly count how many "Present" days exist for the requested month
    const daysPresent = staff.attendance.filter(a => {
      const d = new Date(a.date);
      return a.status === "Present" && (d.getMonth() + 1) === Number(month) && d.getFullYear() === Number(year);
    }).length;

    const calculatedPayout = Math.round((staff.salary / 30) * daysPresent);

    if (calculatedPayout <= 0) {
      return res.status(400).json({ message: "Payout is zero. This employee has no 'Present' days this month." });
    }

    // 🔥 LOOPHOLE 1: DOUBLE SALARY CHECK
    const titleString = `Salary Payout - ${staff.name} (${month}/${year})`;
    const existingExpense = await Expense.findOne({
      restaurantId: req.user.restaurantId,
      category: "Salary",
      title: titleString
    });

    if (existingExpense) {
      return res.status(400).json({ message: `Duplicate! You already paid ${staff.name} for ${month}/${year}.` });
    }

    // Create Expense safely
    const expense = await Expense.create({
      restaurantId: req.user.restaurantId,
      title: titleString,
      amount: calculatedPayout,
      category: "Salary",
      date: new Date(),
      createdBy: req.user._id,
    });

    res.status(200).json({
      message: "Payroll processed successfully",
      payout: calculatedPayout,
      expenseId: expense._id,
    });
  } catch (error) {
    console.error("Payroll Error:", error);
    res.status(500).json({ message: "Failed to process payroll", error: error.message });
  }
};

// 🔥 LOOPHOLE 3: GHOST EMPLOYEE FIX (Remove staff and revoke login)
// @desc    Delete Staff & Revoke Access
// @route   DELETE /api/staff/:id
// @access  Private (Owner)
const removeStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // 1. If they have an email, find and delete their system login!
    if (staff.email) {
      await User.findOneAndDelete({ email: staff.email, restaurantId: req.user.restaurantId });
    }

    // 2. Delete the HR record
    await Staff.findByIdAndDelete(staff._id);

    res.json({ message: "Staff removed and system access revoked." });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove staff" });
  }
};

module.exports = { addStaff, markAttendance, getStaffList, processPayroll, removeStaff };