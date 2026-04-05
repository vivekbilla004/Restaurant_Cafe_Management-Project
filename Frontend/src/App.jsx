import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./store/AuthContext";
import { ProtectedRoute, RoleRoute } from "./routes/RoleRoute";

// --- Layouts & Guards ---
import DashboardLayout from "./layouts/DashboardLayout";
import POSLayout from "./layouts/POSLayout";
import KitchenLayout from "./layouts/KitchenLayout";
import SubscriptionGuard from "./routes/SubscriptionGuard";

// --- Feature Components ---
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import Dashboard from "./features/dashboard/Dashboard";
import MenuManager from "./features/menu/MenuManager";
import OrdersManager from "./features/orders/OrdersManager";
import TablesManager from "./features/tables/TablesManager";
import StaffManager from "./features/staff/StaffManager";
import InventoryManager from "./features/inventory/InventoryManager";
import ExpenseManager from "./features/expenses/ExpenseManager";
import Reports from "./features/reports/Reports";
import POS from "./features/pos/POS";
import KOTScreen from "./features/kot/KOTScreen";
import Subscription from "./features/Subscription/Subscription";
import SuperAdminDashboard from "./features/admin/SuperAdminDashboard";

// Placeholder for settings
const Settings = () => <div className="p-8">Settings Screen</div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (Must have a valid JWT Token) */}
          <Route element={<ProtectedRoute />}>
            {/* ========================================== */}
            {/* UNLOCKED ROUTES (Accessible even if expired) */}
            {/* ========================================== */}
            <Route element={<DashboardLayout />}>
              <Route
                path="/subscription"
                element={
                  <RoleRoute allowedRoles={["Owner"]}>
                    <Subscription />
                  </RoleRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <RoleRoute allowedRoles={["Owner", "Manager"]}>
                    <Settings />
                  </RoleRoute>
                }
              />
            </Route>

            {/* ========================================== */}
            {/* LOCKED ROUTES (Blocked if subscription expires) */}
            {/* ========================================== */}
            <Route element={<SubscriptionGuard />}>
              {/* Apps inside the Sidebar Layout */}
              <Route element={<DashboardLayout />}>
                <Route
                  path="/dashboard"
                  element={
                    <RoleRoute allowedRoles={["Owner", "Manager"]}>
                      <Dashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <RoleRoute allowedRoles={["Owner", "Manager"]}>
                      <MenuManager />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <RoleRoute allowedRoles={["Owner", "Manager","Cashier"]}>
                      <OrdersManager />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <RoleRoute allowedRoles={["Owner"]}>
                      <StaffManager />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <RoleRoute allowedRoles={["Owner","Manager"]}>
                      <InventoryManager />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <RoleRoute allowedRoles={["Owner"]}>
                      <ExpenseManager />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RoleRoute allowedRoles={["Owner", "Manager"]}>
                      <Reports />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/tables"
                  element={
                    <RoleRoute
                      allowedRoles={["Owner", "Waiter", "Manager", "Cashier"]}
                    >
                      <TablesManager />
                    </RoleRoute>
                  }
                />
              </Route>

              {/* POS Screen */}
              <Route element={<POSLayout />}>
                <Route
                  path="/pos"
                  element={
                    <RoleRoute
                      allowedRoles={["Owner", "Manager", "Cashier", "Waiter"]}
                    >
                      <POS />
                    </RoleRoute>
                  }
                />
              </Route>

              {/* Kitchen Screen */}
              <Route element={<KitchenLayout />}>
                <Route
                  path="/kitchen"
                  element={
                    <RoleRoute allowedRoles={["Owner", "Kitchen"]}>
                      <KOTScreen />
                    </RoleRoute>
                  }
                />
              </Route>
            </Route>
          </Route>

          {/* ========================================== */}
          {/* OMICRA GOD-MODE (Super Admin Only)         */}
          {/* ========================================== */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute allowedRoles={["SuperAdmin"]}>
                  <SuperAdminDashboard />
                </RoleRoute>
              }
            />
          </Route>

          {/* Fallback for unauthorized access */}
          <Route
            path="/unauthorized"
            element={
              <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
                <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
                <p className="text-lg text-gray-700">
                  You do not have permission to view this page.
                </p>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
