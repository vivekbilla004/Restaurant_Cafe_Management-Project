const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Route Imports
const userRoutes = require("./src/routes/userRoutes");
const restaurantRoutes = require("./src/routes/restaurantRoutes");
const menuRoutes = require("./src/routes/menuRoutes");
const tableRoutes = require("./src/routes/tableRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const expenseRoutes = require("./src/routes/expenseRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const staffRoutes = require("./src/routes/staffRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
// app.use(cors());
// Allows your React frontend to communicate with this API
app.use(express.json({ limit: "10mb" })); // Allows us to accept JSON data in the body
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Mount Routes
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
// Basic Error Handling Middleware (Catches unhandled route errors)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Omicra SaaS Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});
