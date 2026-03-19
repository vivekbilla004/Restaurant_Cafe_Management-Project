import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ProtectedRoute, RoleRoute } from './routes/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';

// --- Auth Components ---
import Login from './features/auth/Login';
import Register from './features/auth/Register';

// --- Feature Components (Placeholders ready for Phase 2 & beyond) ---
const Dashboard = () => <div className="p-8">Dashboard Screen</div>;
const MenuManager = () => <div className="p-8">Menu Management Screen</div>;
const TablesManager = () => <div className="p-8">Tables Management Screen</div>;
const InventoryManager = () => <div className="p-8">Inventory Management Screen</div>;
const StaffManager = () => <div className="p-8">Staff Management Screen</div>;
const ExpenseManager = () => <div className="p-8">Expense Management Screen</div>;
const Reports = () => <div className="p-8">Reports Screen</div>;
const Subscription = () => <div className="p-8">Subscription Screen</div>;
const Settings = () => <div className="p-8">Settings Screen</div>;

// --- Full Screen / Specialized Views ---
const POS = () => <div className="flex items-center justify-center h-screen w-screen bg-gray-100 text-2xl font-bold">POS Billing Screen (Full Screen)</div>;
const KOTScreen = () => <div className="flex items-center justify-center h-screen w-screen bg-slate-900 text-white text-2xl font-bold">Kitchen Display Screen</div>;
const SuperAdminPanel = () => <div className="p-8">Omicra Super Admin Panel</div>;

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
              {/* Dashboard: Owners and Managers */}
              <Route path="/dashboard" element={<RoleRoute allowedRoles={['Owner', 'Manager']}><Dashboard /></RoleRoute>} />
              
              {/* Master Data & Settings: Owners Only */}
              <Route path="/menu" element={<RoleRoute allowedRoles={['Owner']}><MenuManager /></RoleRoute>} />
              <Route path="/staff" element={<RoleRoute allowedRoles={['Owner']}><StaffManager /></RoleRoute>} />
              <Route path="/subscription" element={<RoleRoute allowedRoles={['Owner']}><Subscription /></RoleRoute>} />
              
              {/* Operations & Reports: Owners and Managers */}
              <Route path="/inventory" element={<RoleRoute allowedRoles={['Owner', 'Manager']}><InventoryManager /></RoleRoute>} />
              <Route path="/expenses" element={<RoleRoute allowedRoles={['Owner', 'Manager']}><ExpenseManager /></RoleRoute>} />
              <Route path="/reports" element={<RoleRoute allowedRoles={['Owner', 'Manager']}><Reports /></RoleRoute>} />
              <Route path="/settings" element={<RoleRoute allowedRoles={['Owner', 'Manager']}><Settings /></RoleRoute>} />

              {/* Floor Operations: Owners, Managers, Waiters */}
              <Route path="/tables" element={<RoleRoute allowedRoles={['Owner', 'Manager', 'Waiter']}><TablesManager /></RoleRoute>} />
            </Route>

            {/* --- FULL SCREEN ROUTES (Outside DashboardLayout) --- */}
            
            {/* POS Screen: Anyone handling orders/billing */}
            <Route path="/pos" element={<RoleRoute allowedRoles={['Owner', 'Manager', 'Cashier', 'Waiter']}><POS /></RoleRoute>} />

            {/* Kitchen Screen: Kitchen Staff and Owners (for oversight) */}
            <Route path="/kitchen" element={<RoleRoute allowedRoles={['Owner', 'Kitchen']}><KOTScreen /></RoleRoute>} />
          </Route>

          {/* Super Admin Route (Omicra God-Mode) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/super-admin" element={<RoleRoute allowedRoles={['SuperAdmin']}><SuperAdminPanel /></RoleRoute>} />
          </Route>

          {/* Fallback for unauthorized access */}
          <Route path="/unauthorized" element={
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
              <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
              <p className="text-lg text-gray-700">You do not have permission to view this page.</p>
            </div>
          } />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;