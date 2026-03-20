// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./store/AuthContext";
// import { ProtectedRoute, RoleRoute } from "./routes/RoleRoute";
// import DashboardLayout from "./layouts/DashboardLayout";
// import MenuManager from "./features/menu/MenuManager";
// import TablesManager from "./features/tables/TablesManager";
// import StaffManager from "./features/staff/StaffManager";
// import POS from "./features/pos/POS";
// import KOTScreen from "./features/kot/KOTScreen";
// import POSLayout from './layouts/POSLayout';
// import KitchenLayout from './layouts/KitchenLayout';

// // --- Auth Components ---
// import Login from "./features/auth/Login";
// import Register from "./features/auth/Register";

// // --- Feature Components (Placeholders ready for Phase 2 & beyond) ---
// const Dashboard = () => <div className="p-8">Dashboard Screen</div>;

// const InventoryManager = () => (
//   <div className="p-8">Inventory Management Screen</div>
// );

// const ExpenseManager = () => (
//   <div className="p-8">Expense Management Screen</div>
// );
// const Reports = () => <div className="p-8">Reports Screen</div>;
// const Subscription = () => <div className="p-8">Subscription Screen</div>;
// const Settings = () => <div className="p-8">Settings Screen</div>;

// // --- Full Screen / Specialized Views ---

// const SuperAdminPanel = () => (
//   <div className="p-8">Omicra Super Admin Panel</div>
// );

// function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<Navigate to="/login" replace />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />

//           {/* Protected Routes (Must have a valid JWT Token) */}
//           <Route element={<ProtectedRoute />}>
//             {/* --- APPS WRAPPED IN THE SIDEBAR/NAVBAR LAYOUT --- */}
//             <Route element={<DashboardLayout />}>
//               {/* Dashboard: Owners and Managers */}
//               <Route
//                 path="/dashboard"
//                 element={
//                   <RoleRoute allowedRoles={["Owner", "Manager"]}>
//                     <Dashboard />
//                   </RoleRoute>
//                 }
//               />

//               {/* Master Data & Settings: Owners Only */}
//               <Route
//                 path="/menu"
//                 element={
//                   <RoleRoute allowedRoles={["Owner"]}>
//                     <MenuManager />
//                   </RoleRoute>
//                 }
//               />
//               <Route
//                 path="/staff"
//                 element={
//                   <RoleRoute allowedRoles={["Owner"]}>
//                     <StaffManager />
//                   </RoleRoute>
//                 }
//               />
//               <Route
//                 path="/subscription"
//                 element={
//                   <RoleRoute allowedRoles={["Owner"]}>
//                     <Subscription />
//                   </RoleRoute>
//                 }
//               />

//               {/* Operations & Reports: Owners and Managers */}
//               <Route
//                 path="/inventory"
//                 element={
//                   <RoleRoute allowedRoles={["Owner", "Manager"]}>
//                     <InventoryManager />
//                   </RoleRoute>
//                 }
//               />
//               <Route
//                 path="/expenses"
//                 element={
//                   <RoleRoute allowedRoles={["Owner", "Manager"]}>
//                     <ExpenseManager />
//                   </RoleRoute>
//                 }
//               />
//               <Route
//                 path="/reports"
//                 element={
//                   <RoleRoute allowedRoles={["Owner", "Manager"]}>
//                     <Reports />
//                   </RoleRoute>
//                 }
//               />
//               <Route
//                 path="/settings"
//                 element={
//                   <RoleRoute allowedRoles={["Owner", "Manager"]}>
//                     <Settings />
//                   </RoleRoute>
//                 }
//               />

//               {/* Floor Operations: Owners, Managers, Waiters */}
//               <Route
//                 path="/tables"
//                 element={
//                   <RoleRoute allowedRoles={["Owner", "Manager", "Waiter"]}>
//                     <TablesManager />
//                   </RoleRoute>
//                 }
//               />
//             </Route>

//             {/* --- FULL SCREEN ROUTES (Outside DashboardLayout) --- */}

//             {/* POS Screen: Anyone handling orders/billing */}
//             <Route
//               path="/pos"
//               element={
//                 <RoleRoute
//                   allowedRoles={["Owner", "Manager", "Cashier", "Waiter"]}
//                 >
//                   <POS />
//                 </RoleRoute>
//               }
//             />

//             {/* Kitchen Screen: Kitchen Staff and Owners (for oversight) */}
//             <Route
//               path="/kitchen"
//               element={
//                 <RoleRoute allowedRoles={["Owner", "Kitchen"]}>
//                   <KOTScreen />
//                 </RoleRoute>
//               }
//             />
//           </Route>

//           {/* Super Admin Route (Omicra God-Mode) */}
//           <Route element={<ProtectedRoute />}>
//             <Route
//               path="/super-admin"
//               element={
//                 <RoleRoute allowedRoles={["SuperAdmin"]}>
//                   <SuperAdminPanel />
//                 </RoleRoute>
//               }
//             />
//           </Route>

//           {/* Fallback for unauthorized access */}
//           <Route
//             path="/unauthorized"
//             element={
//               <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
//                 <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
//                 <p className="text-lg text-gray-700">
//                   You do not have permission to view this page.
//                 </p>
//               </div>
//             }
//           />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./store/AuthContext";
import { ProtectedRoute, RoleRoute } from "./routes/RoleRoute";

// --- Layouts ---
import DashboardLayout from "./layouts/DashboardLayout";
import POSLayout from "./layouts/POSLayout";
import KitchenLayout from "./layouts/KitchenLayout";

// --- Feature Components ---
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import MenuManager from "./features/menu/MenuManager";
import TablesManager from "./features/tables/TablesManager";
import StaffManager from "./features/staff/StaffManager";
import POS from "./features/pos/POS";
import KOTScreen from "./features/kot/KOTScreen";
import OrdersManager from "./features/orders/OrdersManager";
import InventoryManager from "./features/inventory/InventoryManager";
import ExpenseManager from "./features/expenses/ExpenseManager";
import Reports from "./features/reports/Reports";
import Dashboard from "./features/dashboard/Dashboard";

// --- Placeholders ready for Phase 4 & beyond ---
// const Dashboard = () => <div className="p-8">Dashboard Screen</div>;
// const InventoryManager = () => (
//   <div className="p-8">Inventory Management Screen</div>
// );
// const ExpenseManager = () => (
//   <div className="p-8">Expense Management Screen</div>
// );
// const Reports = () => <div className="p-8">Reports Screen</div>;
const Subscription = () => <div className="p-8">Subscription Screen</div>;
const Settings = () => <div className="p-8">Settings Screen</div>;
const SuperAdminPanel = () => (
  <div className="p-8">Omicra Super Admin Panel</div>
);

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
            {/* --- APPS WRAPPED IN THE SIDEBAR/NAVBAR LAYOUT --- */}
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
                  <RoleRoute allowedRoles={["Owner"]}>
                    <MenuManager />
                  </RoleRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <RoleRoute allowedRoles={["Owner", "Manager"]}>
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
                path="/subscription"
                element={
                  <RoleRoute allowedRoles={["Owner"]}>
                    <Subscription />
                  </RoleRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <RoleRoute allowedRoles={["Owner", "Manager"]}>
                    <InventoryManager />
                  </RoleRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <RoleRoute allowedRoles={["Owner", "Manager"]}>
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
                path="/settings"
                element={
                  <RoleRoute allowedRoles={["Owner", "Manager"]}>
                    <Settings />
                  </RoleRoute>
                }
              />
              <Route
                path="/tables"
                element={
                  <RoleRoute allowedRoles={["Owner", "Manager", "Waiter"]}>
                    <TablesManager />
                  </RoleRoute>
                }
              />
            </Route>

            {/* --- FULL SCREEN ROUTES (Wrapped in their specific Layouts) --- */}

            {/* POS Screen (Uses POSLayout) */}
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

            {/* Kitchen Screen (Uses KitchenLayout) */}
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

          {/* Super Admin Route (Omicra God-Mode) */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/super-admin"
              element={
                <RoleRoute allowedRoles={["SuperAdmin"]}>
                  <SuperAdminPanel />
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
