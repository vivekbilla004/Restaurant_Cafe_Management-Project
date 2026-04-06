const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("Owner", "Manager"), getNotifications);
router.put("/:id/read", protect, authorize("Owner", "Manager"), markAsRead);

module.exports = router;
