const Staff = require("../models/Staff");
const Expense = require("../models/Expense");
const User = require("../models/User");

// @desc    Add a new Staff Member
// @route   POST /api/staff
// @access  Private (Owner/Manager)
// const addStaff = async (req, res) => {
//   const { name, role, salary, userId } = req.body;

//   const staff = await Staff.create({
//     restaurantId: req.user.restaurantId,
//     name,
//     role,
//     salary,
//     userId: userId || null,
//   });

//   res.status(201).json(staff);
// };

const addStaff = async (req, res) => {
  try {
    // 1. Extract EVERYTHING from the frontend payload
    const { name, role, salary, phone, email, password } = req.body;

    // 2. Safety Check: If they provided an email, ensure it isn't already used!
    if (email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Email is already registered. Choose another.' });
      }
    }

    // 3. Create the HR / Payroll Record in the Staff Collection
    const staff = await Staff.create({
      restaurantId: req.user.restaurantId,
      name,
      role, 
      salary: Number(salary),
      phone: phone || 'N/A'
    });

    // 4. Create the Login Account in the User Collection (THE MISSING LINK)
    let loginCreated = false;
    
    // If the frontend sent an email AND a password, create the login!
    if (email && password) {
      await User.create({
        restaurantId: req.user.restaurantId, // Ties them to your restaurant
        name,
        email,
        password, // Your User.js pre-save hook will auto-hash this!
        role
      });
      loginCreated = true;
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
  const staff = await Staff.findOne({
    _id: req.params.id,
    restaurantId: req.user.restaurantId,
  });

  if (!staff)
    return res.status(404).json({ message: "Staff member not found" });

  // Prevent duplicate attendance for the same day
  const normalizedDate = new Date(date).setHours(0, 0, 0, 0);
  const existingRecord = staff.attendance.find(
    (a) => new Date(a.date).setHours(0, 0, 0, 0) === normalizedDate,
  );

  if (existingRecord) {
    existingRecord.status = status; // Update if mistake was made
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
  const staffMembers = await Staff.find({
    restaurantId: req.user.restaurantId,
    isActive: true,
  });

  // Calculate dynamically how many days they've worked this month to project salary
  const currentMonth = new Date().getMonth();

  const staffWithStats = staffMembers.map((staff) => {
    const daysPresent = staff.attendance.filter(
      (a) =>
        a.status === "Present" && new Date(a.date).getMonth() === currentMonth,
    ).length;

    return {
      ...staff._doc,
      daysPresentThisMonth: daysPresent,
      // Basic pro-rata calculation: (Salary / 30 days) * days present
      estimatedPayout: Math.round((staff.salary / 30) * daysPresent),
    };
  });

  res.json(staffWithStats);
};

/////////////////////***************** EXPENSE CONTROLLER SNIPPET FOR REFERENCE ******************/
// const processPayroll = async (req, res) => {
//   try {
//     const { month, year , payoutAmount } = req.body;

//     // 1. Find the Employee
//     const staff = await Staff.findOne({
//       _id: req.params.id,
//       restaurantId: req.user.restaurantId,
//     });

//     if (!staff) return res.status(404).json({ message: "Staff not found" });

//     // 2. Calculate Payout (Salary / 30 days * Days Present)
//     const dailyWage = staff.salary / 30;
//     const daysPresent = staff.daysPresentThisMonth || 0;
//     const payoutAmount = Math.round(dailyWage * daysPresent);

//     if (payoutAmount <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Payout is zero. Mark attendance first." });
//     }

//     // 3. THE MAGIC LINK: Create the Expense Record automatically!
//     const expense = await Expense.create({
//       restaurantId: req.user.restaurantId,
//       title: `Salary Payout - ${staff.name} (${month}/${year})`,
//       amount: payoutAmount,
//       category: "Salary", // Must match your Expense category enum
//       date: new Date(),
//       createdBy: req.user._id,
//     });

//     // 4. Reset attendance for the new month
//     staff.daysPresentThisMonth = 0;
//     staff.estimatedPayout = 0;
//     await staff.save();

//     res.status(200).json({
//       message: "Payroll processed successfully",
//       payout: payoutAmount,
//       expenseId: expense._id,
//     });
//   } catch (error) {
//     console.error("Payroll Error:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to process payroll", error: error.message });
//   }
// };

// @desc    Process Monthly Payroll & Create Expense Record
// @route   POST /api/staff/:id/payroll
// @access  Private (Owner)
// @desc    Process Monthly Payroll & Create Expense Record
// @route   POST /api/staff/:id/payroll
// @access  Private (Owner)
const processPayroll = async (req, res) => {
  try {
    console.log("1. Payroll API Hit. Body:", req.body);
    const { month, year, payoutAmount } = req.body;

    console.log("2. Finding Staff ID:", req.params.id);
    const staff = await Staff.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!staff) {
      console.log("Error: Staff not found");
      return res.status(404).json({ message: "Staff not found" });
    }

    const finalPayout = Number(payoutAmount);
    console.log("3. Final Payout Calculated:", finalPayout);

    if (!finalPayout || finalPayout <= 0) {
      return res
        .status(400)
        .json({ message: "Payout is zero. Mark attendance first." });
    }

    console.log("4. Attempting to create Expense...");
    // If it crashes here, it's an Expense Schema issue
    const expense = await Expense.create({
      restaurantId: req.user.restaurantId,
      title: `Salary Payout - ${staff.name} (${month}/${year})`,
      amount: finalPayout,
      category: "Salary",
      date: new Date(),
      createdBy: req.user._id,
    });
    console.log("5. Expense Created Successfully! ID:", expense._id);

    console.log("6. Surgically updating Staff Attendance...");
    // THE FIX: Use updateOne to bypass strict document-wide validation traps
    await Staff.updateOne(
      { _id: staff._id },
      { $set: { daysPresentThisMonth: 0 } },
    );
    console.log("7. Staff Updated. Transaction Complete.");

    res.status(200).json({
      message: "Payroll processed successfully",
      payout: finalPayout,
      expenseId: expense._id,
    });
  } catch (error) {
    // THIS WILL TELL US EXACTLY WHAT EXPLODED
    console.error("\n!!! CRITICAL PAYROLL ERROR !!!");
    console.error(error);
    console.error("------------------------------\n");
    res
      .status(500)
      .json({ message: "Failed to process payroll", error: error.message });
  }
};

module.exports = { processPayroll /* keep your other exports here */ };
module.exports = { addStaff, markAttendance, getStaffList, processPayroll };
