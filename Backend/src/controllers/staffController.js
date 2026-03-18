const Staff = require('../models/Staff');

// @desc    Add a new Staff Member
// @route   POST /api/staff
// @access  Private (Owner/Manager)
const addStaff = async (req, res) => {
  const { name, role, salary, userId } = req.body;

  const staff = await Staff.create({
    restaurantId: req.user.restaurantId,
    name,
    role,
    salary,
    userId: userId || null
  });

  res.status(201).json(staff);
};

// @desc    Mark Daily Attendance
// @route   POST /api/staff/:id/attendance
// @access  Private (Owner/Manager)
const markAttendance = async (req, res) => {
  const { date, status } = req.body;
  const staff = await Staff.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });

  if (!staff) return res.status(404).json({ message: 'Staff member not found' });

  // Prevent duplicate attendance for the same day
  const normalizedDate = new Date(date).setHours(0,0,0,0);
  const existingRecord = staff.attendance.find(a => new Date(a.date).setHours(0,0,0,0) === normalizedDate);

  if (existingRecord) {
    existingRecord.status = status; // Update if mistake was made
  } else {
    staff.attendance.push({ date: new Date(date), status });
  }

  await staff.save();
  res.json({ message: 'Attendance recorded', staff });
};

// @desc    Get Staff & Calculate Estimated Monthly Salary
// @route   GET /api/staff
// @access  Private (Owner/Manager)
const getStaffList = async (req, res) => {
  const staffMembers = await Staff.find({ restaurantId: req.user.restaurantId, isActive: true });
  
  // Calculate dynamically how many days they've worked this month to project salary
  const currentMonth = new Date().getMonth();
  
  const staffWithStats = staffMembers.map(staff => {
    const daysPresent = staff.attendance.filter(a => 
      a.status === 'Present' && new Date(a.date).getMonth() === currentMonth
    ).length;

    return {
      ...staff._doc,
      daysPresentThisMonth: daysPresent,
      // Basic pro-rata calculation: (Salary / 30 days) * days present
      estimatedPayout: Math.round((staff.salary / 30) * daysPresent)
    };
  });

  res.json(staffWithStats);
};

module.exports = { addStaff, markAttendance, getStaffList };