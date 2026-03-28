const express = require("express");
const router = express.Router();
const {
  addStaff,
  markAttendance,
  getStaffList,
  processPayroll,
} = require("../controllers/staffController");
const { protect, authorize,checkSubscription } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, checkSubscription, authorize("Owner", "Manager"), addStaff)
  .get(protect, checkSubscription, authorize("Owner", "Manager"), getStaffList);

router.post(
  "/:id/attendance",
  protect,
  checkSubscription,
  authorize("Owner", "Manager"),
  markAttendance,
);

router.post('/:id/payroll', protect, authorize('Owner'), processPayroll);

module.exports = router;
