# Restaurant & Café Management SaaS API (Omicra)

A robust, multi-tenant backend architecture built for the Omicra Restaurant & Café Management System. This RESTful API handles POS billing, kitchen order tickets (KOT), automated inventory deduction, staff payroll, and financial reporting.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcryptjs (Password Hashing)

## 🏗️ Core Architecture

This system utilizes a strict **Multi-Tenant Architecture**. Every database query is secured by a `protect` middleware that intercepts the JWT, extracts the `restaurantId`, and filters operations to ensure data isolation between different restaurant clients. It also enforces rigorous Role-Based Access Control (RBAC) for Owners, Managers, Cashiers, Waiters, and Kitchen staff.

## ⚙️ Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/yourusername/omicra-backend.git](https://github.com/yourusername/omicra-backend.git)
   cd omicra-backend

   ```

2. **Install dependencies:**
   npm install

3. **Environment Variables:**
   Create a .env file in the root directory and add the following:  

   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb+srv://<your_username>:<your_password>@cluster0.mongodb.net/omicra_saas_db?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key

4. **Start the Development Server:**   
   npm run dev
# (Ensure you have nodemon installed, or use: node server.js)

## API Module Breakdown

/api/auth - User login and SaaS registration (Auto-triggers 30-day trial).

/api/menu - Categories and Items (Optimized single-query for POS load speeds).

/api/tables - Floor plan management and live order tracking.

/api/orders - Core POS engine, tax calculation, and payment status.

/api/inventory - Raw material tracking with Recipe-based auto-deduction.

/api/staff - HR, attendance, and payroll processing.

/api/reports - Real-time MongoDB aggregations for Profit & Loss tracking.


## 🔒 Security Posture
No Hard Deletions: Critical entities (Orders, Menu Items, Tables) utilize soft-deletes (isActive: false) to preserve historical financial integrity.

Immutable Historical Pricing: Orders capture a snapshot of the menu item price at the time of purchase, preventing historical data corruption if menu prices change later.
