const express = require("express");
const router = express.Router();
const {
  addStaff,
  markAttendance,
  getStaffList,
  processPayroll,
} = require("../controllers/staffController");
const { protect, authorize } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, authorize("Owner", "Manager"), addStaff)
  .get(protect, authorize("Owner", "Manager"), getStaffList);

router.post(
  "/:id/attendance",
  protect,
  authorize("Owner", "Manager"),
  markAttendance,
);
router.post("/:id/payroll", protect, authorize("Owner"), processPayroll);

module.exports = router;
